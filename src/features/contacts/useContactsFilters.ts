import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { applyChange, parseFilters, toSearchParams, type ContactsFilters } from './filters';

/**
 * The contact list's filters, kept in the URL: links are shareable, reload keeps the view and
 * the browser's Back button steps through earlier views.
 */
export function useContactsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<ContactsFilters>, options: { replace?: boolean } = {}) => {
      // The updater form reads the latest URL, so quick successive updates never overwrite each other.
      setSearchParams((previous) => toSearchParams(applyChange(parseFilters(previous), patch)), {
        replace: options.replace,
      });
    },
    [setSearchParams],
  );

  const clear = useCallback(() => {
    setSearchParams(
      (previous) => {
        const { sort, order, pageSize } = parseFilters(previous);
        // Keep how the list is sorted and paged; only drop what narrows it.
        return toSearchParams({ q: '', companyId: '', page: 1, pageSize, sort, order });
      },
      { replace: false },
    );
  }, [setSearchParams]);

  return { filters, update, clear };
}
