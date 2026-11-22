import { describe, expect, it } from 'vitest';
import { seedSchema } from '../api/schemas';
import seedJson from './seed.json';
import { createDb, shiftSeedDates } from './db';

const seed = seedSchema.parse(seedJson);

describe('seed data', () => {
  it('has the expected volume', () => {
    expect(seed.users).toHaveLength(5);
    expect(seed.companies).toHaveLength(40);
    expect(seed.contacts).toHaveLength(180);
    expect(seed.deals).toHaveLength(90);
    expect(seed.activities).toHaveLength(300);
  });

  it('only references records that exist', () => {
    const ids = (items: { id: string }[]) => new Set(items.map((item) => item.id));
    const users = ids(seed.users);
    const companies = ids(seed.companies);
    const contacts = ids(seed.contacts);
    const deals = ids(seed.deals);

    for (const contact of seed.contacts) {
      expect(companies.has(contact.companyId)).toBe(true);
      expect(users.has(contact.ownerId)).toBe(true);
    }
    for (const deal of seed.deals) {
      expect(contacts.has(deal.contactId)).toBe(true);
      expect(companies.has(deal.companyId)).toBe(true);
      expect(users.has(deal.ownerId)).toBe(true);
    }
    for (const activity of seed.activities) {
      expect(contacts.has(activity.contactId)).toBe(true);
      expect(activity.dealId === null || deals.has(activity.dealId)).toBe(true);
    }
  });

  it('closes only won and lost deals', () => {
    for (const deal of seed.deals) {
      const isClosed = deal.stage === 'ganho' || deal.stage === 'perdido';
      expect(deal.closedAt !== null).toBe(isClosed);
    }
  });
});

describe('shiftSeedDates', () => {
  it('moves every date by the time elapsed since the seed was generated', () => {
    const now = new Date(new Date(seed.referenceDate).getTime() + 100 * 24 * 60 * 60 * 1000);
    const shifted = shiftSeedDates(seed, now);
    const hundredDays = 100 * 24 * 60 * 60 * 1000;

    const original = seed.deals.find((deal) => deal.closedAt !== null);
    const moved = shifted.deals.find((deal) => deal.id === original?.id);
    expect(new Date(moved!.createdAt).getTime() - new Date(original!.createdAt).getTime()).toBe(
      hundredDays,
    );
    expect(new Date(moved!.closedAt!).getTime() - new Date(original!.closedAt!).getTime()).toBe(
      hundredDays,
    );
    expect(shifted.referenceDate).toBe(now.toISOString());
  });

  it('keeps open deals open (closedAt stays null)', () => {
    const shifted = shiftSeedDates(seed, new Date());
    const open = shifted.deals.filter((deal) => deal.stage !== 'ganho' && deal.stage !== 'perdido');
    expect(open.every((deal) => deal.closedAt === null)).toBe(true);
  });

  it('never leaves activity dates in the future', () => {
    const now = new Date();
    const { activities } = createDb(now);
    expect(activities.every((activity) => new Date(activity.date) <= now)).toBe(true);
  });
});
