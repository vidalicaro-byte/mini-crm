import { dealStageSchema, type Overview, type Period } from '../api/schemas';
import type { db as Db } from './db';

const DAY = 24 * 60 * 60 * 1000;

type Database = typeof Db;

interface Viewer {
  id: string;
  role: string;
}

/** Calendar months are cut in UTC: good enough for demo data. */
const startOfMonth = (date: Date, monthsBack = 0) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - monthsBack, 1));

interface Window {
  start: number;
  end: number;
}

/** [start, end) of the chosen period and of the same-length period right before it. */
function windows(period: Period, now: Date): { current: Window; previous: Window } {
  if (period === '12m') {
    const start = startOfMonth(now, 11).getTime();
    const previousStart = startOfMonth(now, 23).getTime();
    return {
      current: { start, end: now.getTime() + 1 },
      previous: { start: previousStart, end: start },
    };
  }
  const length = { '7d': 7, '30d': 30, '90d': 90 }[period] * DAY;
  const end = now.getTime() + 1;
  return {
    current: { start: end - length, end },
    previous: { start: end - 2 * length, end: end - length },
  };
}

const within = (iso: string | null, window: Window) => {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return time >= window.start && time < window.end;
};

function buckets(period: Period, now: Date, current: Window): Overview['revenue'] {
  if (period === '12m') {
    return {
      granularity: 'month',
      buckets: Array.from({ length: 12 }, (_, index) => ({
        start: startOfMonth(now, 11 - index).toISOString(),
        value: 0,
      })),
    };
  }
  const granularity = period === '90d' ? 'week' : 'day';
  const size = granularity === 'week' ? 7 * DAY : DAY;
  const count = Math.ceil((current.end - current.start) / size);
  return {
    granularity,
    // Oldest first; the first week of a 90-day period may start before the period does.
    buckets: Array.from({ length: count }, (_, index) => ({
      start: new Date(current.end - (count - index) * size).toISOString(),
      value: 0,
    })),
  };
}

export function computeOverview(
  database: Database,
  viewer: Viewer,
  period: Period,
  now = new Date(),
): Overview {
  const mine = <T extends { ownerId: string }>(items: T[]) =>
    viewer.role === 'admin' ? items : items.filter((item) => item.ownerId === viewer.id);
  const contacts = mine(database.contacts);
  const deals = mine(database.deals);
  const { current, previous } = windows(period, now);

  const wonIn = (window: Window) =>
    deals.filter((deal) => deal.stage === 'ganho' && within(deal.closedAt, window));
  const lostIn = (window: Window) =>
    deals.filter((deal) => deal.stage === 'perdido' && within(deal.closedAt, window));
  const sum = (items: { value: number }[]) => items.reduce((total, deal) => total + deal.value, 0);
  const rate = (window: Window) => {
    const won = wonIn(window).length;
    const closed = won + lostIn(window).length;
    return closed === 0 ? null : won / closed;
  };

  const open = deals.filter((deal) => deal.stage !== 'ganho' && deal.stage !== 'perdido');
  const created = deals.filter((deal) => within(deal.createdAt, current));
  const revenue = buckets(period, now, current);
  for (const deal of wonIn(current)) {
    const time = new Date(deal.closedAt ?? 0).getTime();
    // The bucket is the last one that starts at or before the deal's closing time.
    const bucket = [...revenue.buckets]
      .reverse()
      .find((candidate) => new Date(candidate.start).getTime() <= time);
    if (bucket) bucket.value += deal.value;
  }

  return {
    period,
    totals: { contacts: contacts.length, companies: database.companies.length },
    newContacts: {
      current: contacts.filter((contact) => within(contact.createdAt, current)).length,
      previous: contacts.filter((contact) => within(contact.createdAt, previous)).length,
    },
    wonRevenue: { current: sum(wonIn(current)), previous: sum(wonIn(previous)) },
    conversionRate: { current: rate(current), previous: rate(previous) },
    openDeals: { count: open.length, value: sum(open) },
    funnel: dealStageSchema.options.map((stage) => {
      const inStage = created.filter((deal) => deal.stage === stage);
      return { stage, count: inStage.length, value: sum(inStage) };
    }),
    revenue,
  };
}
