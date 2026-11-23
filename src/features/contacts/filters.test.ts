import { describe, expect, it } from 'vitest';
import {
  applyChange,
  defaultFilters,
  hasActiveFilters,
  parseFilters,
  toSearchParams,
  type ContactsFilters,
} from './filters';

const parse = (search: string) => parseFilters(new URLSearchParams(search));

describe('parseFilters', () => {
  it('uses the defaults for an empty query string', () => {
    expect(parse('')).toEqual(defaultFilters);
  });

  it('reads every filter', () => {
    expect(parse('q=ana&empresa=cmp_3&page=4&tamanho=10&ordem=createdAt&sentido=desc')).toEqual({
      q: 'ana',
      companyId: 'cmp_3',
      page: 4,
      pageSize: 10,
      sort: 'createdAt',
      order: 'desc',
    });
  });

  it('trims the search text', () => {
    expect(parse('q=%20%20ana%20').q).toBe('ana');
  });

  it.each(['0', '-2', '1.5', 'abc', ''])('falls back to page 1 for page=%j', (page) => {
    expect(parse(`page=${page}`).page).toBe(1);
  });

  it('falls back to the default for values that are not allowed', () => {
    const filters = parse('tamanho=999&ordem=password&sentido=sideways');
    expect(filters.pageSize).toBe(25);
    expect(filters.sort).toBe('name');
    expect(filters.order).toBe('asc');
  });
});

describe('toSearchParams', () => {
  it('writes nothing for the default view', () => {
    expect(toSearchParams(defaultFilters).toString()).toBe('');
  });

  it('writes only what differs from the default', () => {
    const params = toSearchParams({ ...defaultFilters, q: 'ana', page: 3 });
    expect(params.toString()).toBe('q=ana&page=3');
  });

  it('round-trips any set of filters', () => {
    const filters: ContactsFilters = {
      q: 'joão & maria',
      companyId: 'cmp_9',
      page: 7,
      pageSize: 50,
      sort: 'company',
      order: 'desc',
    };
    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });
});

describe('applyChange', () => {
  const onPage3: ContactsFilters = { ...defaultFilters, page: 3, q: 'ana' };

  it('goes back to page 1 when the search changes', () => {
    expect(applyChange(onPage3, { q: 'ana m' }).page).toBe(1);
  });

  it.each([
    ['companyId', { companyId: 'cmp_1' }],
    ['pageSize', { pageSize: 50 }],
    ['sort', { sort: 'email' }],
    ['order', { order: 'desc' }],
  ] as const)('goes back to page 1 when %s changes', (_name, patch) => {
    expect(applyChange(onPage3, patch).page).toBe(1);
  });

  it('keeps the requested page when only the page changes', () => {
    expect(applyChange(onPage3, { page: 5 }).page).toBe(5);
  });

  it('keeps the page when the "change" does not change anything', () => {
    expect(applyChange(onPage3, { q: 'ana' }).page).toBe(3);
  });
});

describe('hasActiveFilters', () => {
  it('is true for a search or a company, not for sorting or paging', () => {
    expect(hasActiveFilters(defaultFilters)).toBe(false);
    expect(hasActiveFilters({ ...defaultFilters, sort: 'email', page: 2, pageSize: 10 })).toBe(
      false,
    );
    expect(hasActiveFilters({ ...defaultFilters, q: 'a' })).toBe(true);
    expect(hasActiveFilters({ ...defaultFilters, companyId: 'cmp_1' })).toBe(true);
  });
});
