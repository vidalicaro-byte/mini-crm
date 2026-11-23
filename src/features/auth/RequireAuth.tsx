import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ForbiddenPage } from '../../app/ForbiddenPage';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import type { UserRole } from '../../api/schemas';
import { useAuth } from './AuthContext';

function Centered({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>{children}</Box>
  );
}

/** Gate for the signed-in part of the app: waits for the session check, then lets users in. */
export function RequireAuth() {
  const { status, signedOutByUser, retry, logout } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullPageSpinner label="Verificando sessão" />;
  }

  if (status === 'error') {
    return (
      <Centered>
        <Alert
          severity="error"
          action={
            <>
              <Button color="inherit" size="small" onClick={retry}>
                Tentar novamente
              </Button>
              <Button color="inherit" size="small" onClick={logout}>
                Sair
              </Button>
            </>
          }
        >
          Não foi possível verificar sua sessão.
        </Alert>
      </Centered>
    );
  }

  if (status === 'unauthenticated') {
    // After an expiry, remember where the user was so login can send them back there. After
    // an explicit sign-out, don't: the next person to sign in should start at the beginning.
    return <Navigate to="/login" replace state={signedOutByUser ? null : { from: location }} />;
  }

  return <Outlet />;
}

/** Gate for pages restricted to some roles. The API enforces the same rule; this is the UI side. */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <ForbiddenPage />;
  return <Outlet />;
}
