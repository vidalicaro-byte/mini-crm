import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockViewport } from '../test/matchMedia';
import { renderApp } from '../test/renderApp';

describe('AppLayout (desktop)', () => {
  it('shows the main navigation and marks the current page', async () => {
    await renderApp('/contatos');

    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);
    expect(within(nav).getByRole('link', { name: 'Contatos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Visão geral' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('navigates between pages, updating heading, title and focus', async () => {
    const { user } = await renderApp('/');

    await user.click(screen.getByRole('link', { name: 'Funil' }));

    // Pages load on demand, so the new heading appears a moment after the click.
    expect(await screen.findByRole('heading', { level: 1, name: 'Funil' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Funil · Mini-CRM'));
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('shows only the initials in the account button, not a stock avatar icon as well', async () => {
    await renderApp('/');

    const account = screen.getByRole('button', { name: /^Conta de / });
    expect(account.querySelector('svg')).toBeNull();
    expect(account.querySelector('[data-initials]')).toHaveAttribute('data-initials', 'MA');
  });

  it('offers a skip link to the main content', async () => {
    await renderApp('/');
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute(
      'href',
      '#conteudo',
    );
  });

  it('shows a not found page for unknown addresses', async () => {
    const { user, router } = await renderApp('/nao-existe');

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
    const { user } = await renderApp('/');

    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
    const nav = await screen.findByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getByRole('link', { name: 'Contatos' }));

    // While the modal drawer is open, the rest of the page is aria-hidden, so wait for it to close.
    await waitFor(() =>
      expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Contatos' })).toBeInTheDocument();
    // Focus lands on the content only after the drawer has finished closing.
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('never moves focus into a page that is still aria-hidden while the drawer closes', async () => {
    mockViewport('mobile');
    const { user } = await renderApp('/');
    const focusedInsideHiddenTree: string[] = [];
    const originalFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (...args) {
      if (this.closest('[aria-hidden="true"]')) focusedInsideHiddenTree.push(this.tagName);
      return originalFocus.apply(this, args);
    };

    try {
      await user.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
      const nav = await screen.findByRole('navigation', { name: 'Principal' });
      await user.click(within(nav).getByRole('link', { name: 'Funil' }));
      await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
    } finally {
      HTMLElement.prototype.focus = originalFocus;
    }

    expect(focusedInsideHiddenTree).toEqual([]);
  });

  it('returns focus to the menu button when the menu is closed with Escape', async () => {
    mockViewport('mobile');
    const { user } = await renderApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
    await screen.findByRole('navigation', { name: 'Principal' });
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Abrir menu de navegação' })).toHaveFocus(),
    );
  });
});
