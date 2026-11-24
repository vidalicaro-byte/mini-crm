import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { overviewSchema, type Period } from '../../api/schemas';

export const overviewKeys = {
  all: ['overview'] as const,
  period: (period: Period) => [...overviewKeys.all, period] as const,
};

export const overviewQuery = (period: Period) =>
  queryOptions({
    queryKey: overviewKeys.period(period),
    queryFn: ({ signal }) =>
      apiRequest('/overview', { schema: overviewSchema, query: { period }, signal }),
    // Switching period keeps showing the previous numbers (dimmed) instead of a blank page.
    placeholderData: keepPreviousData,
  });
