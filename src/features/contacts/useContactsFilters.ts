import { useUrlFilters, type UrlFiltersConfig } from '../../hooks/useUrlFilters';
import {
  applyChange,
  defaultFilters,
  parseFilters,
  toSearchParams,
  type ContactsFilters,
} from './filters';

const config: UrlFiltersConfig<ContactsFilters> = {
  parse: parseFilters,
  serialize: toSearchParams,
  apply: applyChange,
  // Keep how the list is sorted and paged; only drop what narrows it.
  cleared: ({ sort, order, pageSize }) => ({ ...defaultFilters, sort, order, pageSize }),
};

/** The contact list's filters, kept in the URL. */
export const useContactsFilters = () => useUrlFilters(config);
