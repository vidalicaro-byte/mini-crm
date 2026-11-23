import { createContext, useContext } from 'react';
import type { LoginRequest, User } from '../../api/schemas';

/**
 * loading: a stored token is being checked with the server.
 * error: the check failed for a reason other than the token being rejected (e.g. offline).
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** True when the last session ended because the user chose to sign out (not an expiry). */
  signedOutByUser: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  /** Re-runs the session check after an `error` status. */
  retry: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
