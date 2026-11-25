import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface UrlFiltersConfig<T> {
  /** Reads the filters from the query string, falling back to defaults for anything invalid. */
  parse: (params: URLSearchParams) => T;
  /** Writes the filters to a query string, leaving out defaults. */
  serialize: (filters: T) => URLSearchParams;
  /** Applies a change (a change to what is listed usually returns to page 1). */
  apply: (current: T, patch: Partial<T>) => T;
  /** What "clear filters" leaves: drops what narrows the list but keeps how it is sorted and paged. */
  cleared: (current: T) => T;
}

/**
 * A list's filters, kept in the URL: links are shareable, reload keeps the view and the browser's
 * Back button steps through earlier views. Pass a config object defined outside the component
 * (a stable reference).
 */
export function useUrlFilters<T>({ parse, serialize, apply, cleared }: UrlFiltersConfig<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parse(searchParams), [parse, searchParams]);

  const update = useCallback(
    (patch: Partial<T>, options: { replace?: boolean } = {}) => {
      // The updater form reads the latest URL, so quick successive updates never overwrite each other.
      setSearchParams((previous) => serialize(apply(parse(previous), patch)), {
        replace: options.replace,
      });
    },
    [setSearchParams, parse, serialize, apply],
  );

  const clear = useCallback(() => {
    setSearchParams((previous) => serialize(cleared(parse(previous))), { replace: false });
  }, [setSearchParams, parse, serialize, cleared]);

  return { filters, update, clear };
}
