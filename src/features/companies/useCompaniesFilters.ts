import { useUrlFilters, type UrlFiltersConfig } from '../../hooks/useUrlFilters';
import {
  applyChange,
  defaultFilters,
  parseFilters,
  toSearchParams,
  type CompaniesFilters,
} from './filters';

const config: UrlFiltersConfig<CompaniesFilters> = {
  parse: parseFilters,
  serialize: toSearchParams,
  apply: applyChange,
  cleared: ({ sort, order, pageSize }) => ({ ...defaultFilters, sort, order, pageSize }),
};

/** The company list's filters, kept in the URL. */
export const useCompaniesFilters = () => useUrlFilters(config);
