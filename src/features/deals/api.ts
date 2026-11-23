import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { dealSchema, paginatedSchema } from '../../api/schemas';

export const dealKeys = {
  all: ['deals'] as const,
  byContact: (contactId: string) => [...dealKeys.all, 'contact', contactId] as const,
};

export const contactDealsQuery = (contactId: string) =>
  queryOptions({
    queryKey: dealKeys.byContact(contactId),
    queryFn: ({ signal }) =>
      apiRequest('/deals', { schema: paginatedSchema(dealSchema), query: { contactId }, signal }),
  });
