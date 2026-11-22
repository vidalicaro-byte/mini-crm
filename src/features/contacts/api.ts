import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { contactResponseSchema, paginatedSchema } from '../../api/schemas';

export type ContactsParams = {
  page?: number;
  pageSize?: number;
  sort?: 'name' | 'email' | 'company' | 'createdAt';
  order?: 'asc' | 'desc';
  q?: string;
  companyId?: string;
};

export const contactKeys = {
  all: ['contacts'] as const,
  list: (params: ContactsParams) => [...contactKeys.all, 'list', params] as const,
  detail: (id: string) => [...contactKeys.all, 'detail', id] as const,
};

export const fetchContacts = (params: ContactsParams = {}, signal?: AbortSignal) =>
  apiRequest('/contacts', {
    schema: paginatedSchema(contactResponseSchema),
    query: params,
    signal,
  });

export const fetchContact = (id: string, signal?: AbortSignal) =>
  apiRequest(`/contacts/${id}`, { schema: contactResponseSchema, signal });

export const contactsQuery = (params: ContactsParams = {}) =>
  queryOptions({
    queryKey: contactKeys.list(params),
    queryFn: ({ signal }) => fetchContacts(params, signal),
    // Keep showing the previous page while the next one loads.
    placeholderData: keepPreviousData,
  });

export const contactQuery = (id: string) =>
  queryOptions({
    queryKey: contactKeys.detail(id),
    queryFn: ({ signal }) => fetchContact(id, signal),
  });
