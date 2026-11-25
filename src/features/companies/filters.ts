import { COMPANY_SIZES, type CompanySize } from '../../api/schemas';

export const PAGE_SIZES = [10, 25, 50] as const;
export const SORT_FIELDS = [
  'name',
  'industry',
  'size',
  'city',
  'contactsCount',
  'openDealsValue',
] as const;

export type PageSize = (typeof PAGE_SIZES)[number];
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface CompaniesFilters {
  /** Free-text search over name, industry and city. */
  q: string;
  /** '' means every size. */
  size: CompanySize | '';
  /** 1-based, as shown in the URL. */
  page: number;
  pageSize: PageSize;
  sort: SortField;
  order: SortOrder;
}

export const defaultFilters: CompaniesFilters = {
  q: '',
  size: '',
  page: 1,
  pageSize: 25,
  sort: 'name',
  order: 'asc',
};

function oneOf<T extends string | number>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.find((item) => String(item) === value);
}

/** Reads the filters from a query string; anything missing or invalid falls back to the default. */
export function parseFilters(params: URLSearchParams): CompaniesFilters {
  const page = Number(params.get('page'));
  return {
    q: params.get('q')?.trim() ?? defaultFilters.q,
    size: oneOf(params.get('porte'), COMPANY_SIZES) ?? defaultFilters.size,
    page: Number.isInteger(page) && page >= 1 ? page : defaultFilters.page,
    pageSize: oneOf(params.get('tamanho'), PAGE_SIZES) ?? defaultFilters.pageSize,
    sort: oneOf(params.get('ordem'), SORT_FIELDS) ?? defaultFilters.sort,
    order: oneOf(params.get('sentido'), ['asc', 'desc'] as const) ?? defaultFilters.order,
  };
}

const paramNames = {
  q: 'q',
  size: 'porte',
  page: 'page',
  pageSize: 'tamanho',
  sort: 'ordem',
  order: 'sentido',
} as const satisfies Record<keyof CompaniesFilters, string>;

/** Writes filters to a query string, leaving out values that equal the default (short URLs). */
export function toSearchParams(filters: CompaniesFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(paramNames) as (keyof CompaniesFilters)[]) {
    if (filters[key] !== defaultFilters[key]) params.set(paramNames[key], String(filters[key]));
  }
  return params;
}

/** True when the user has narrowed the list (search or size), ignoring sort and paging. */
export function hasActiveFilters(filters: CompaniesFilters) {
  return filters.q !== '' || filters.size !== '';
}

/** Applies a change. Anything that changes *what* is listed sends the user back to page 1. */
export function applyChange(
  current: CompaniesFilters,
  patch: Partial<CompaniesFilters>,
): CompaniesFilters {
  const next = { ...current, ...patch };
  const changesContent = (['q', 'size', 'pageSize', 'sort', 'order'] as const).some(
    (key) => next[key] !== current[key],
  );
  if (changesContent && patch.page === undefined) next.page = 1;
  return next;
}
