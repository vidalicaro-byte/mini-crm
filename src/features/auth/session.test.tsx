import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { tokenStore } from '../../api/tokenStore';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';
import { DEMO_PASSWORD } from './demoAccounts';

describe('protected routes', () => {
  it('sends a signed-out visitor to the login page', async () => {
    const { router } = await renderApp('/contatos', { as: null });

    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('takes the user back to the page they asked for after signing in', async () => {
    const { user, router } = await renderApp('/funil', { as: null });

    await user.type(screen.getByLabelText('E-mail'), 'marina@minicrm.demo');
    await user.type(screen.getByLabelText('Senha'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Funil' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/funil');
  });

  it('ends the session when the API says the token is no longer valid', async () => {
    server.use(
      http.get('/api/contacts', () =>
        HttpResponse.json({ message: 'Sessão expirada.' }, { status: 401 }),
      ),
    );
    const { router } = await renderApp('/', { as: 'admin' });

    // The overview asks for the contact total, gets a 401 and the session is dropped.
    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(tokenStore.get()).toBeNull();
  });

  it('rejects a stored token the server does not accept', async () => {
    tokenStore.set('token-invalido');
    const { router } = await renderApp('/', { as: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(tokenStore.get()).toBeNull();
  });

  it('offers retry or sign out when the session cannot be checked (e.g. offline)', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.error()));
    const { user } = await renderApp('/', { as: 'admin', waitForPage: false });

    expect(await screen.findByText('Não foi possível verificar sua sessão.')).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Visão geral' }),
    ).toBeInTheDocument();
  });
});

describe('sign out', () => {
  it('returns to the login page and forgets the session', async () => {
    const { user, router } = await renderApp('/contatos');

    await user.click(screen.getByRole('button', { name: 'Conta de Marina Albuquerque' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('starts the next person at the overview, not at the page the previous one left', async () => {
    const { user, router } = await renderApp('/equipe');
    await screen.findByRole('heading', { level: 1, name: 'Equipe' });

    await user.click(screen.getByRole('button', { name: 'Conta de Marina Albuquerque' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }));
    await screen.findByRole('heading', { level: 1, name: 'Entrar' });

    // A seller signs in on the same browser: /equipe would be forbidden for them.
    await user.click(screen.getByRole('button', { name: 'Entrar como vendedor' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Visão geral' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('does not leak the previous user data to the next one', async () => {
    const { user, queryClient } = await renderApp('/');
    expect(await within(screen.getByRole('main')).findByText('180')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Conta de Marina Albuquerque' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }));
    await screen.findByRole('heading', { level: 1, name: 'Entrar' });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe('roles', () => {
  it('shows the Equipe page and menu item to the admin', async () => {
    const { user } = await renderApp('/', { as: 'admin' });

    await user.click(
      within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', {
        name: 'Equipe',
      }),
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Equipe' })).toBeInTheDocument();
    expect(await screen.findByText('rafael@minicrm.demo')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('hides the Equipe menu item from a seller', async () => {
    await renderApp('/', { as: 'seller' });

    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expect(within(nav).queryByRole('link', { name: 'Equipe' })).not.toBeInTheDocument();
  });

  it('blocks a seller who opens /equipe directly', async () => {
    await renderApp('/equipe', { as: 'seller' });

    expect(screen.getByRole('heading', { level: 1, name: 'Sem permissão' })).toBeInTheDocument();
    expect(screen.queryByText('rafael@minicrm.demo')).not.toBeInTheDocument();
  });

  it("limits a seller's overview totals to their own contacts", async () => {
    await renderApp('/', { as: 'seller' });

    const main = within(screen.getByRole('main'));
    expect(await main.findByText('40')).toBeInTheDocument(); // companies are shared
    expect(main.queryByText('180')).not.toBeInTheDocument();
  });
});
