import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { fetchCompanies, fetchCompany } from '../features/companies/api';
import { fetchContact, fetchContacts } from '../features/contacts/api';
import { db } from './db';

describe('GET /api/contacts', () => {
  it('paginates, defaulting to 20 per page', async () => {
    const result = await fetchContacts();
    expect(result.total).toBe(180);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.data).toHaveLength(20);
  });

  it('returns the requested page and a short last page', async () => {
    const last = await fetchContacts({ page: 4, pageSize: 50 });
    expect(last.data).toHaveLength(30);
    const first = await fetchContacts({ page: 1, pageSize: 50 });
    expect(first.data.map((c) => c.id)).not.toContain(last.data[0]?.id);
  });

  it('caps the page size at 100', async () => {
    const result = await fetchContacts({ pageSize: 500 });
    expect(result.pageSize).toBe(100);
    expect(result.data).toHaveLength(100);
  });

  it('sorts by name in both directions', async () => {
    const asc = await fetchContacts({ sort: 'name', order: 'asc', pageSize: 100 });
    const desc = await fetchContacts({ sort: 'name', order: 'desc', pageSize: 100 });
    const names = asc.data.map((contact) => contact.name);
    expect(names).toEqual(
      [...names].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })),
    );
    expect(desc.data[0]?.name).not.toBe(asc.data[0]?.name);
  });

  it('searches by name, ignoring case', async () => {
    const target = db.contacts[0]!;
    const term = target.name.slice(0, 5).toUpperCase();
    const result = await fetchContacts({ q: term, pageSize: 100 });
    expect(result.data.map((contact) => contact.id)).toContain(target.id);
    expect(
      result.data.every((c) =>
        `${c.name} ${c.email} ${c.company.name}`.toLowerCase().includes(term.toLowerCase()),
      ),
    ).toBe(true);
  });

  it('searches by company name', async () => {
    const company = db.companies[0]!;
    const result = await fetchContacts({ q: company.name, pageSize: 100 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.data.every((contact) => contact.company.name === company.name)).toBe(true);
  });

  it('filters by company', async () => {
    const companyId = db.contacts[0]!.companyId;
    const expected = db.contacts.filter((contact) => contact.companyId === companyId).length;
    const result = await fetchContacts({ companyId, pageSize: 100 });
    expect(result.total).toBe(expected);
  });

  it('returns an empty page, not an error, when nothing matches', async () => {
    const result = await fetchContacts({ q: 'zzzz-sem-resultado' });
    expect(result).toMatchObject({ total: 0, data: [] });
  });
});

describe('GET /api/contacts/:id', () => {
  it('returns the contact with its company', async () => {
    const contact = db.contacts[3]!;
    const result = await fetchContact(contact.id);
    expect(result.id).toBe(contact.id);
    expect(result.company.id).toBe(contact.companyId);
  });

  it('answers 404 for an unknown contact', async () => {
    const error = await fetchContact('nao-existe').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: 'Contato não encontrado.' });
  });
});

describe('companies', () => {
  it('lists companies with a total', async () => {
    const result = await fetchCompanies({ pageSize: 10 });
    expect(result.total).toBe(40);
    expect(result.data).toHaveLength(10);
  });

  it('searches by industry', async () => {
    const result = await fetchCompanies({ q: 'tecnologia', pageSize: 100 });
    expect(result.total).toBeGreaterThan(0);
    expect(
      result.data.every(
        (company) =>
          company.industry === 'Tecnologia' ||
          /tecnologia/i.test(`${company.name} ${company.city}`),
      ),
    ).toBe(true);
  });

  it('returns one company and 404 for an unknown one', async () => {
    const company = db.companies[1]!;
    await expect(fetchCompany(company.id)).resolves.toMatchObject({
      id: company.id,
      name: company.name,
    });
    await expect(fetchCompany('nao-existe')).rejects.toMatchObject({
      status: 404,
      message: 'Empresa não encontrada.',
    });
  });
});
