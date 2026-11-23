import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { paginatedSchema, userSchema } from '../../api/schemas';

export const teamKeys = {
  all: ['team'] as const,
  list: () => [...teamKeys.all, 'list'] as const,
};

export const fetchUsers = (signal?: AbortSignal) =>
  apiRequest('/users', { schema: paginatedSchema(userSchema), query: { pageSize: 100 }, signal });

export const teamQuery = () =>
  queryOptions({
    queryKey: teamKeys.list(),
    queryFn: ({ signal }) => fetchUsers(signal),
  });
