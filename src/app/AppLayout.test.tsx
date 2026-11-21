import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockViewport } from '../test/matchMedia';
import { renderApp } from '../test/renderApp';

describe('AppLayout (desktop)', () => {
  it('shows the main navigation and marks the current page', () => {
    renderApp('/contatos');

    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expect(within(nav).getByRole('link', { name: 'Contatos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Visão geral' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('navigates between pages, updating heading, title and focus', async () => {
    const { user } = renderApp('/');

    await user.click(screen.getByRole('link', { name: 'Funil' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Funil' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Funil · Mini-CRM'));
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('offers a skip link to the main content', () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute(
      'href',
      '#conteudo',
    );
  });

  it('shows a not found page for unknown addresses', async () => {
    const { user, router } = renderApp('/nao-existe');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Voltar para a visão geral' }));
    expect(router.state.location.pathname).toBe('/');
  });
});

describe('AppLayout (mobile)', () => {
  it('hides the navigation until the menu button is used, then closes it on navigation', async () => {
    mockViewport('mobile');
    const { user } = renderApp('/');

    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
    const nav = await screen.findByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getByRole('link', { name: 'Contatos' }));

    // While the modal drawer is open, the rest of the page is aria-hidden, so wait for it to close.
    await waitFor(() =>
      expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Contatos' })).toBeInTheDocument();
  });

  it('returns focus to the menu button when the menu is closed with Escape', async () => {
    mockViewport('mobile');
    const { user } = renderApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
    await screen.findByRole('navigation', { name: 'Principal' });
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Abrir menu de navegação' })).toHaveFocus(),
    );
  });
});
