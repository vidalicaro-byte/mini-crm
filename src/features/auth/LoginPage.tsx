import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { ApiError } from '../../api/client';
import { loginRequestSchema, type LoginRequest } from '../../api/schemas';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { ColorModeToggle } from '../../theme/ColorModeToggle';
import { useAuth } from './AuthContext';
import { DEMO_PASSWORD, demoAccounts, demoAccountsEnabled } from './demoAccounts';

/** Where to go after signing in: the page the user was heading to, or the start page. */
function getRedirectPath(state: unknown) {
  const from = (state as { from?: { pathname?: unknown } } | null)?.from?.pathname;
  return typeof from === 'string' && from.startsWith('/') && from !== '/login' ? from : '/';
}

export function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  async function signIn(credentials: LoginRequest) {
    setSubmitError(null);
    try {
      await login(credentials);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError && error.status !== 0
          ? error.message
          : 'Não foi possível entrar. Verifique sua conexão e tente novamente.',
      );
    }
  }

  // A stored token is still being checked: don't flash the form at someone who is signed in.
  if (status === 'loading') return <FullPageSpinner label="Verificando sessão" />;

  if (status === 'authenticated') {
    return <Navigate to={getRedirectPath(location.state)} replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <title>Entrar · Mini-CRM</title>
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <ColorModeToggle />
      </Box>

      <Card variant="outlined" sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Entrar
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Acesse o painel do Mini-CRM.
          </Typography>

          <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit(signIn)}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <TextField
              label="E-mail"
              type="email"
              autoComplete="username"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Senha"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} aria-label="Entrando" /> : 'Entrar'}
            </Button>
          </Stack>

          {demoAccountsEnabled && (
            <>
              <Divider sx={{ my: 3 }}>Conta de demonstração</Divider>
              <Stack spacing={1}>
                {demoAccounts.map((account) => (
                  <Button
                    key={account.email}
                    variant="outlined"
                    disabled={isSubmitting}
                    onClick={() => void signIn({ email: account.email, password: DEMO_PASSWORD })}
                  >
                    {account.label}
                  </Button>
                ))}
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, display: 'block' }}
              >
                Os dados são fictícios e ficam apenas no seu navegador.
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
