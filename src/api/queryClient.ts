import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';
import { tokenStore } from './tokenStore';

/** Retry only network/server failures; a 4xx will fail the same way again. */
function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

/** An expired or invalid token ends the session, wherever the request came from.
 * The auth provider notices the token is gone and sends the user to the login page. */
function endSessionOnUnauthorized(error: Error) {
  if (error instanceof ApiError && error.status === 401) tokenStore.clear();
}

export function createQueryClient({ retry = true }: { retry?: boolean } = {}) {
  return new QueryClient({
    queryCache: new QueryCache({ onError: endSessionOnUnauthorized }),
    mutationCache: new MutationCache({ onError: endSessionOnUnauthorized }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: retry ? shouldRetry : false,
        refetchOnWindowFocus: false,
      },
    },
  });
}
