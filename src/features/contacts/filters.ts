export const PAGE_SIZES = [10, 25, 50] as const;
export const SORT_FIELDS = ['name', 'email', 'company', 'createdAt'] as const;

export type PageSize = (typeof PAGE_SIZES)[number];
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface ContactsFilters {
  /** Free-text search over name, e-mail and company. */
  q: string;
  companyId: string;
  /** 1-based, as shown in the URL. */
  page: number;
  pageSize: PageSize;
  sort: SortField;
  order: SortOrder;
}

export const defaultFilters: ContactsFilters = {
  q: '',
  companyId: '',
  page: 1,
  pageSize: 25,
  sort: 'name',
  order: 'asc',
};

function oneOf<T extends string | number>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.find((item) => String(item) === value);
}

/**
 * Reads the filters from a URL query string. Anything missing or invalid falls back to the
 * default, so a hand-edited or outdated link never breaks the page.
 */
export function parseFilters(params: URLSearchParams): ContactsFilters {
  const page = Number(params.get('page'));
  return {
    q: params.get('q')?.trim() ?? defaultFilters.q,
    companyId: params.get('empresa') ?? defaultFilters.companyId,
    page: Number.isInteger(page) && page >= 1 ? page : defaultFilters.page,
    pageSize: oneOf(params.get('tamanho'), PAGE_SIZES) ?? defaultFilters.pageSize,
    sort: oneOf(params.get('ordem'), SORT_FIELDS) ?? defaultFilters.sort,
    order: oneOf(params.get('sentido'), ['asc', 'desc'] as const) ?? defaultFilters.order,
  };
}

const paramNames = {
  q: 'q',
  companyId: 'empresa',
  page: 'page',
  pageSize: 'tamanho',
  sort: 'ordem',
  order: 'sentido',
} as const satisfies Record<keyof ContactsFilters, string>;

/** Writes filters to a query string, leaving out values that equal the default (short URLs). */
export function toSearchParams(filters: ContactsFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(paramNames) as (keyof ContactsFilters)[]) {
    if (filters[key] !== defaultFilters[key]) params.set(paramNames[key], String(filters[key]));
  }
  return params;
}

/** True when the user has narrowed the list (search or company), ignoring sort and paging. */
export function hasActiveFilters(filters: ContactsFilters) {
  return filters.q !== '' || filters.companyId !== '';
}

/** Applies a change. Anything that changes *what* is listed sends the user back to page 1. */
export function applyChange(
  current: ContactsFilters,
  patch: Partial<ContactsFilters>,
): ContactsFilters {
  const next = { ...current, ...patch };
  const changesContent = (['q', 'companyId', 'pageSize', 'sort', 'order'] as const).some(
    (key) => next[key] !== current[key],
  );
  if (changesContent && patch.page === undefined) next.page = 1;
  return next;
}
