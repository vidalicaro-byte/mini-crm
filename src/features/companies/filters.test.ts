import { describe, expect, it } from 'vitest';
import {
  applyChange,
  defaultFilters,
  hasActiveFilters,
  parseFilters,
  toSearchParams,
  type CompaniesFilters,
} from './filters';

const parse = (search: string) => parseFilters(new URLSearchParams(search));

describe('company filters in the URL', () => {
  it('uses the defaults for an empty query string', () => {
    expect(parse('')).toEqual(defaultFilters);
  });

  it('reads every filter', () => {
    expect(parse('q=tec&porte=grande&page=2&tamanho=10&ordem=contactsCount&sentido=desc')).toEqual({
      q: 'tec',
      size: 'grande',
      page: 2,
      pageSize: 10,
      sort: 'contactsCount',
      order: 'desc',
    });
  });

  it('ignores values that are not allowed', () => {
    const filters = parse('porte=gigante&ordem=password&sentido=sideways&tamanho=999&page=-1');
    expect(filters).toEqual(defaultFilters);
  });

  it('writes nothing for the default view and only what differs otherwise', () => {
    expect(toSearchParams(defaultFilters).toString()).toBe('');
    expect(toSearchParams({ ...defaultFilters, size: 'media', page: 3 }).toString()).toBe(
      'porte=media&page=3',
    );
  });

  it('round-trips any set of filters', () => {
    const filters: CompaniesFilters = {
      q: 'são & paulo',
      size: 'pequena',
      page: 4,
      pageSize: 50,
      sort: 'openDealsValue',
      order: 'desc',
    };
    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });
});

describe('changing company filters', () => {
  const onPage3: CompaniesFilters = { ...defaultFilters, page: 3, q: 'a' };

  it.each([
    { q: 'ab' },
    { size: 'grande' },
    { pageSize: 50 },
    { sort: 'city' },
    { order: 'desc' },
  ] as const)('goes back to page 1 when %o changes', (patch) => {
    expect(applyChange(onPage3, patch).page).toBe(1);
  });

  it('keeps the requested page when only the page changes', () => {
    expect(applyChange(onPage3, { page: 5 }).page).toBe(5);
  });

  it('counts a search or a size as filtering, but not sorting or paging', () => {
    expect(hasActiveFilters(defaultFilters)).toBe(false);
    expect(hasActiveFilters({ ...defaultFilters, sort: 'city', page: 2 })).toBe(false);
    expect(hasActiveFilters({ ...defaultFilters, q: 'a' })).toBe(true);
    expect(hasActiveFilters({ ...defaultFilters, size: 'media' })).toBe(true);
  });
});
