import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { tokenStore } from '../../api/tokenStore';
import type { LoginRequest } from '../../api/schemas';
import { authKeys, meQuery, requestLogin } from './api';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // The token is the source of truth: no token, no session.
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.get);
  const [signedOutByUser, setSignedOutByUser] = useState(false);
  const me = useQuery({ ...meQuery(), enabled: token !== null, retry: false });

  // When the session ends, drop everything fetched for that user.
  useEffect(() => {
    if (token === null) queryClient.clear();
  }, [token, queryClient]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const { token: newToken, user } = await requestLogin(credentials);
      queryClient.setQueryData(authKeys.me, user);
      setSignedOutByUser(false);
      tokenStore.set(newToken);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    setSignedOutByUser(true);
    tokenStore.clear();
  }, []);
  const retry = useCallback(() => void me.refetch(), [me]);

  const status: AuthStatus =
    token === null
      ? 'unauthenticated'
      : me.data
        ? 'authenticated'
        : me.isError
          ? 'error'
          : 'loading';

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: token === null ? null : (me.data ?? null),
      signedOutByUser,
      login,
      logout,
      retry,
    }),
    [status, token, me.data, signedOutByUser, login, logout, retry],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
