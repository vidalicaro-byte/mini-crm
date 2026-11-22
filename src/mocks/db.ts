import { seedSchema, type Seed } from '../api/schemas';
import seedJson from './seed.json';

/**
 * Moves every date in the seed forward by the time elapsed since it was generated, so
 * the demo always looks recent ("this month" always has data, however old the build is).
 */
export function shiftSeedDates(seed: Seed, now: Date): Seed {
  const offset = now.getTime() - new Date(seed.referenceDate).getTime();
  const shift = (iso: string) => new Date(new Date(iso).getTime() + offset).toISOString();

  return {
    ...seed,
    referenceDate: now.toISOString(),
    contacts: seed.contacts.map((contact) => ({ ...contact, createdAt: shift(contact.createdAt) })),
    deals: seed.deals.map((deal) => ({
      ...deal,
      createdAt: shift(deal.createdAt),
      expectedCloseDate: shift(deal.expectedCloseDate),
      closedAt: deal.closedAt ? shift(deal.closedAt) : null,
    })),
    activities: seed.activities.map((activity) => ({ ...activity, date: shift(activity.date) })),
  };
}

export function createDb(now = new Date()) {
  const seed = shiftSeedDates(seedSchema.parse(seedJson), now);
  return {
    users: seed.users,
    companies: seed.companies,
    contacts: seed.contacts,
    deals: seed.deals,
    activities: seed.activities,
  };
}

/** The in-memory database behind the mock API. Reset it in tests with `resetDb()`. */
export const db = createDb();

export function resetDb(now = new Date()) {
  Object.assign(db, createDb(now));
}
