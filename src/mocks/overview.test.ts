import { describe, expect, it } from 'vitest';
import { PERIODS } from '../api/schemas';
import { createDb } from './db';
import { computeOverview } from './overview';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const day = (offset: number) => new Date(NOW.getTime() + offset * 86_400_000).toISOString();

function dbWith(
  deals: {
    stage: string;
    value: number;
    createdAt: string;
    closedAt: string | null;
    ownerId?: string;
  }[],
  contactDates: string[] = [],
) {
  const database = createDb(NOW);
  database.contacts = contactDates.map((createdAt, index) => ({
    ...database.contacts[0]!,
    id: `c${index}`,
    createdAt,
  }));
  database.deals = deals.map((deal, index) => ({
    ...database.deals[0]!,
    id: `d${index}`,
    ownerId: 'usr_1',
    ...deal,
    stage: deal.stage as never,
  }));
  return database;
}

const admin = { id: 'usr_1', role: 'admin' };

describe('computeOverview', () => {
  it('counts new contacts in the period against the period before it', () => {
    const database = dbWith([], [day(-1), day(-5), day(-10), day(-40), day(-200)]);
    const overview = computeOverview(database, admin, '30d', NOW);
    expect(overview.newContacts).toEqual({ current: 3, previous: 1 });
    expect(overview.totals.contacts).toBe(5);
  });

  it('sums only won deals closed inside each window', () => {
    const database = dbWith([
      { stage: 'ganho', value: 100, createdAt: day(-50), closedAt: day(-3) },
      { stage: 'ganho', value: 50, createdAt: day(-80), closedAt: day(-40) },
      { stage: 'ganho', value: 7, createdAt: day(-300), closedAt: day(-200) },
      { stage: 'perdido', value: 999, createdAt: day(-20), closedAt: day(-2) },
    ]);
    const overview = computeOverview(database, admin, '30d', NOW);
    expect(overview.wonRevenue).toEqual({ current: 100, previous: 50 });
  });

  it('computes the conversion rate, or null when nothing was closed', () => {
    const database = dbWith([
      { stage: 'ganho', value: 1, createdAt: day(-20), closedAt: day(-3) },
      { stage: 'perdido', value: 1, createdAt: day(-20), closedAt: day(-2) },
      { stage: 'perdido', value: 1, createdAt: day(-20), closedAt: day(-4) },
      { stage: 'perdido', value: 1, createdAt: day(-20), closedAt: day(-5) },
    ]);
    const overview = computeOverview(database, admin, '30d', NOW);
    expect(overview.conversionRate).toEqual({ current: 0.25, previous: null });
  });

  it('describes open deals as of now, whatever the period', () => {
    const database = dbWith([
      { stage: 'novo', value: 10, createdAt: day(-300), closedAt: null },
      { stage: 'negociacao', value: 20, createdAt: day(-2), closedAt: null },
      { stage: 'ganho', value: 500, createdAt: day(-2), closedAt: day(-1) },
    ]);
    for (const period of PERIODS) {
      expect(computeOverview(database, admin, period, NOW).openDeals).toEqual({
        count: 2,
        value: 30,
      });
    }
  });

  it('lists every stage in funnel order, counting deals created in the period', () => {
    const database = dbWith([
      { stage: 'novo', value: 10, createdAt: day(-2), closedAt: null },
      { stage: 'novo', value: 5, createdAt: day(-3), closedAt: null },
      { stage: 'novo', value: 99, createdAt: day(-100), closedAt: null },
      { stage: 'perdido', value: 1, createdAt: day(-4), closedAt: day(-1) },
    ]);
    const { funnel } = computeOverview(database, admin, '30d', NOW);
    expect(funnel.map((item) => item.stage)).toEqual([
      'novo',
      'contato',
      'proposta',
      'negociacao',
      'ganho',
      'perdido',
    ]);
    expect(funnel[0]).toEqual({ stage: 'novo', count: 2, value: 15 });
    expect(funnel[5]).toEqual({ stage: 'perdido', count: 1, value: 1 });
  });

  it.each([
    ['7d', 'day', 7],
    ['30d', 'day', 30],
    ['90d', 'week', 13],
    ['12m', 'month', 12],
  ] as const)(
    'buckets revenue for %s by %s (%i buckets, oldest first)',
    (period, granularity, count) => {
      const { revenue } = computeOverview(dbWith([]), admin, period, NOW);
      expect(revenue.granularity).toBe(granularity);
      expect(revenue.buckets).toHaveLength(count);
      const starts = revenue.buckets.map((bucket) => bucket.start);
      expect(starts).toEqual([...starts].sort());
    },
  );

  it('puts each won deal in the bucket of its closing day, and the buckets add up', () => {
    const database = dbWith([
      { stage: 'ganho', value: 100, createdAt: day(-20), closedAt: day(-1) },
      { stage: 'ganho', value: 40, createdAt: day(-20), closedAt: day(-1) },
      { stage: 'ganho', value: 7, createdAt: day(-20), closedAt: day(-6) },
    ]);
    const { revenue, wonRevenue } = computeOverview(database, admin, '7d', NOW);
    expect(revenue.buckets.map((bucket) => bucket.value).reduce((a, b) => a + b, 0)).toBe(
      wonRevenue.current,
    );
    expect(revenue.buckets.at(-2)?.value).toBe(140);
  });

  it('keeps month buckets aligned to calendar months', () => {
    const { revenue } = computeOverview(dbWith([]), admin, '12m', NOW);
    expect(revenue.buckets[11]?.start).toBe('2026-06-01T00:00:00.000Z');
    expect(revenue.buckets[0]?.start).toBe('2025-07-01T00:00:00.000Z');
  });

  it("limits a seller's numbers to their own contacts and deals, but not the companies", () => {
    const database = dbWith([
      { stage: 'ganho', value: 100, createdAt: day(-5), closedAt: day(-1), ownerId: 'usr_1' },
      { stage: 'ganho', value: 900, createdAt: day(-5), closedAt: day(-1), ownerId: 'usr_2' },
    ]);
    const overview = computeOverview(database, { id: 'usr_2', role: 'seller' }, '30d', NOW);
    expect(overview.wonRevenue.current).toBe(900);
    expect(overview.totals.companies).toBe(database.companies.length);
  });

  it('works on the seed data for every period', () => {
    const database = createDb();
    for (const period of PERIODS) {
      const overview = computeOverview(database, admin, period);
      expect(overview.totals.contacts).toBe(180);
      expect(overview.funnel).toHaveLength(6);
    }
  });
});
