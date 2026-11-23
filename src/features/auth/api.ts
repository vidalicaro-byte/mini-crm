import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { loginResponseSchema, userSchema, type LoginRequest } from '../../api/schemas';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export const requestLogin = (credentials: LoginRequest) =>
  apiRequest('/auth/login', { schema: loginResponseSchema, method: 'POST', body: credentials });

/** The signed-in user, as the server sees it for the current token. */
export const meQuery = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => apiRequest('/auth/me', { schema: userSchema, signal }),
    // The session user rarely changes; re-checking happens when the token changes.
    staleTime: Infinity,
  });
