import { beforeEach, describe, expect, it } from 'vitest';
import { COMPANY_SIZES } from '../api/schemas';
import { fetchCompanies, fetchCompany } from '../features/companies/api';
import { fetchCompanyDeals } from '../features/deals/api';
import { signInAs } from '../test/session';
import { db } from './db';

const isOpen = (stage: string) => stage !== 'ganho' && stage !== 'perdido';

/** The figures a company should show, worked out straight from the data (optionally for one owner). */
function expectedFigures(companyId: string, ownerId?: string) {
  const mine = <T extends { ownerId: string }>(item: T) => !ownerId || item.ownerId === ownerId;
  const open = db.deals.filter(
    (deal) => deal.companyId === companyId && mine(deal) && isOpen(deal.stage),
  );
  return {
    contactsCount: db.contacts.filter((c) => c.companyId === companyId && mine(c)).length,
    openDeals: { count: open.length, value: open.reduce((sum, deal) => sum + deal.value, 0) },
  };
}

const everyCompany = () => fetchCompanies({ pageSize: 100 });

describe('company figures', () => {
  beforeEach(() => {
    signInAs('admin');
  });

  it('adds the contact count and the open deals to each company', async () => {
    const { data } = await everyCompany();
    expect(data).toHaveLength(40);
    for (const company of data) {
      expect({ contactsCount: company.contactsCount, openDeals: company.openDeals }).toEqual(
        expectedFigures(company.id),
      );
    }
  });

  it('does not count won or lost deals as open', async () => {
    const { data } = await everyCompany();
    const totalOpen = data.reduce((sum, company) => sum + company.openDeals.count, 0);
    expect(totalOpen).toBe(db.deals.filter((deal) => isOpen(deal.stage)).length);
    expect(totalOpen).toBeLessThan(db.deals.length);
  });

  it('gives the same figures for one company as in the list', async () => {
    const { data } = await everyCompany();
    const listed = data.find((company) => company.openDeals.count > 0);
    if (!listed) throw new Error('seed has no company with open deals');
    await expect(fetchCompany(listed.id)).resolves.toEqual(listed);
  });

  it("counts only a seller's own contacts and deals", async () => {
    const admin = await everyCompany();
    const seller = signInAs('seller');
    const mine = await everyCompany();

    for (const company of mine.data) {
      expect({ contactsCount: company.contactsCount, openDeals: company.openDeals }).toEqual(
        expectedFigures(company.id, seller.id),
      );
    }
    const sum = (list: typeof admin) => list.data.reduce((n, c) => n + c.contactsCount, 0);
    expect(sum(mine)).toBeLessThan(sum(admin));
    // Every company is still listed: only the figures are personal.
    expect(mine.total).toBe(40);
  });
});

describe('company list: filter, search and sort', () => {
  beforeEach(() => {
    signInAs('admin');
  });

  it.each(COMPANY_SIZES)('filters by size "%s"', async (size) => {
    const result = await fetchCompanies({ size, pageSize: 100 });
    expect(result.total).toBe(db.companies.filter((company) => company.size === size).length);
    expect(result.data.every((company) => company.size === size)).toBe(true);
  });

  it('combines the size filter with a search', async () => {
    const target = db.companies.find((company) => company.size === 'grande');
    if (!target) throw new Error('seed has no large company');
    const result = await fetchCompanies({ size: 'grande', q: target.name, pageSize: 100 });
    expect(result.data.map((company) => company.id)).toContain(target.id);
    expect(result.data.every((company) => company.size === 'grande')).toBe(true);
  });

  it('searches by city', async () => {
    const target = db.companies[0]!;
    const result = await fetchCompanies({ q: target.city.toUpperCase(), pageSize: 100 });
    expect(result.data.map((company) => company.id)).toContain(target.id);
  });

  it('sorts by number of contacts, then by name for companies that tie', async () => {
    const { data } = await fetchCompanies({ sort: 'contactsCount', order: 'desc', pageSize: 100 });
    const counts = data.map((company) => company.contactsCount);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));

    const namesByCount = new Map<number, string[]>();
    for (const company of data) {
      namesByCount.set(company.contactsCount, [
        ...(namesByCount.get(company.contactsCount) ?? []),
        company.name,
      ]);
    }
    expect(namesByCount.size).toBeLessThan(data.length); // some companies do tie
    for (const names of namesByCount.values()) {
      expect(names).toEqual(
        [...names].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })),
      );
    }
  });

  it('sorts by the value of open deals', async () => {
    const { data } = await fetchCompanies({ sort: 'openDealsValue', order: 'desc', pageSize: 100 });
    const values = data.map((company) => company.openDeals.value);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(values[0]).toBeGreaterThan(0);
  });

  it('sorts by size from small to large, not alphabetically', async () => {
    const { data } = await fetchCompanies({ sort: 'size', order: 'asc', pageSize: 100 });
    const ranks = data.map((company) => COMPANY_SIZES.indexOf(company.size));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});

describe('deals of a company', () => {
  it('lists every deal of the company for the admin', async () => {
    signInAs('admin');
    const company = db.companies.find((item) => db.deals.some((d) => d.companyId === item.id))!;
    const result = await fetchCompanyDeals(company.id);
    expect(result.data.map((deal) => deal.id).sort()).toEqual(
      db.deals
        .filter((deal) => deal.companyId === company.id)
        .map((deal) => deal.id)
        .sort(),
    );
  });

  it("lists only a seller's own deals", async () => {
    const seller = signInAs('seller');
    for (const company of db.companies) {
      const result = await fetchCompanyDeals(company.id);
      expect(result.data.every((deal) => deal.ownerId === seller.id)).toBe(true);
      expect(result.data.every((deal) => deal.company.id === company.id)).toBe(true);
    }
  });
});
