import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { activitySchema, paginatedSchema } from '../../api/schemas';

export const activityKeys = {
  all: ['activities'] as const,
  byContact: (contactId: string) => [...activityKeys.all, 'contact', contactId] as const,
};

export const contactActivitiesQuery = (contactId: string) =>
  queryOptions({
    queryKey: activityKeys.byContact(contactId),
    queryFn: ({ signal }) =>
      apiRequest('/activities', {
        schema: paginatedSchema(activitySchema),
        query: { contactId },
        signal,
      }),
  });
