import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { tokenStore } from '../../api/tokenStore';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';
import { DEMO_PASSWORD } from './demoAccounts';

async function fillAndSubmit(
  user: Awaited<ReturnType<typeof renderApp>>['user'],
  email: string,
  password: string,
) {
  if (email) await user.type(screen.getByLabelText('E-mail'), email);
  if (password) await user.type(screen.getByLabelText('Senha'), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginPage', () => {
  it('shows validation messages and sends nothing when the form is empty', async () => {
    const { user } = await renderApp('/login', { as: null });

    await fillAndSubmit(user, '', '');

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
  });

  it('asks for a well-formed e-mail', async () => {
    const { user } = await renderApp('/login', { as: null });

    await fillAndSubmit(user, 'isso-nao-e-email', 'qualquer');

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
  });

  it('shows the server message when the credentials are wrong', async () => {
    const { user } = await renderApp('/login', { as: null });

    await fillAndSubmit(user, 'marina@minicrm.demo', 'senha-errada');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(tokenStore.get()).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it('explains connection problems instead of showing a technical message', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.error()));
    const { user } = await renderApp('/login', { as: null });

    await fillAndSubmit(user, 'marina@minicrm.demo', DEMO_PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('Verifique sua conexão');
  });

  it('signs in with valid credentials and lands on the overview', async () => {
    const { user, router } = await renderApp('/login', { as: null });

    await fillAndSubmit(user, 'marina@minicrm.demo', DEMO_PASSWORD);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Visão geral' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(tokenStore.get()).not.toBeNull();
  });

  it('offers one-click demo accounts for each role', async () => {
    const { user } = await renderApp('/login', { as: null });

    await user.click(screen.getByRole('button', { name: 'Entrar como vendedor' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Visão geral' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Conta de Rafael Tavares' }));
    expect(await screen.findByText('Vendedor')).toBeInTheDocument();
  });

  it('sends a signed-in user away from the login page', async () => {
    const { router } = await renderApp('/login');
    expect(router.state.location.pathname).toBe('/');
  });
});
