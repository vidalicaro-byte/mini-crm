import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { dealResponseSchema, paginatedSchema, type DealStage } from '../../api/schemas';

export const dealKeys = {
  all: ['deals'] as const,
  board: ['deals', 'board'] as const,
  byContact: (contactId: string) => [...dealKeys.all, 'contact', contactId] as const,
};

const dealsSchema = paginatedSchema(dealResponseSchema);

export const contactDealsQuery = (contactId: string) =>
  queryOptions({
    queryKey: dealKeys.byContact(contactId),
    queryFn: ({ signal }) =>
      apiRequest('/deals', { schema: dealsSchema, query: { contactId }, signal }),
  });

/** Every deal the user may see, for the funnel board. */
export const dealsBoardQuery = () =>
  queryOptions({
    queryKey: dealKeys.board,
    queryFn: ({ signal }) => apiRequest('/deals', { schema: dealsSchema, signal }),
  });

export const moveDeal = (id: string, stage: DealStage) =>
  apiRequest(`/deals/${id}`, { schema: dealResponseSchema, method: 'PATCH', body: { stage } });
