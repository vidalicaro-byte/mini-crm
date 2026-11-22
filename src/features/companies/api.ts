import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { companySchema, paginatedSchema } from '../../api/schemas';

export type CompaniesParams = {
  page?: number;
  pageSize?: number;
  sort?: 'name' | 'industry' | 'city';
  order?: 'asc' | 'desc';
  q?: string;
};

export const companyKeys = {
  all: ['companies'] as const,
  list: (params: CompaniesParams) => [...companyKeys.all, 'list', params] as const,
  detail: (id: string) => [...companyKeys.all, 'detail', id] as const,
};

export const fetchCompanies = (params: CompaniesParams = {}, signal?: AbortSignal) =>
  apiRequest('/companies', { schema: paginatedSchema(companySchema), query: params, signal });

export const fetchCompany = (id: string, signal?: AbortSignal) =>
  apiRequest(`/companies/${id}`, { schema: companySchema, signal });

export const companiesQuery = (params: CompaniesParams = {}) =>
  queryOptions({
    queryKey: companyKeys.list(params),
    queryFn: ({ signal }) => fetchCompanies(params, signal),
    placeholderData: keepPreviousData,
  });

export const companyQuery = (id: string) =>
  queryOptions({
    queryKey: companyKeys.detail(id),
    queryFn: ({ signal }) => fetchCompany(id, signal),
  });
