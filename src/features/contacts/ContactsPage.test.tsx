import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';

const rowsOf = () => within(screen.getByRole('grid')).getAllByRole('row').slice(1);
const total = () => screen.getByRole('status');

describe('contacts list', () => {
  it('shows the first page of contacts with the total', async () => {
    await renderApp('/contatos');

    await waitFor(() => expect(total()).toHaveTextContent('180 contatos'));
    expect(await screen.findByRole('grid', { name: 'Lista de contatos' })).toBeInTheDocument();
    expect(rowsOf()).toHaveLength(25);
  });

  it('shows a seller only their own contacts', async () => {
    await renderApp('/contatos', { as: 'seller' });

    await waitFor(() => expect(total()).toHaveTextContent(/^\d+ contatos$/));
    expect(total()).not.toHaveTextContent('180');
  });

  it('reads the filters from the URL', async () => {
    await renderApp('/contatos?tamanho=10&page=2&ordem=email&sentido=desc');

    await waitFor(() => expect(rowsOf()).toHaveLength(10));
    const emails = rowsOf().map(
      (row) => within(row).getAllByRole('gridcell')[1]?.textContent ?? '',
    );
    expect(emails).toEqual([...emails].sort((a, b) => b.localeCompare(a, 'pt-BR')));
  });

  it('searches on the server after a pause and keeps the search in the URL', async () => {
    const { user, router } = await renderApp('/contatos');
    await waitFor(() => expect(total()).toHaveTextContent('180 contatos'));

    await user.type(screen.getByLabelText('Buscar contatos'), 'zzzz-sem-resultado');

    expect(await screen.findByText('Nenhum contato encontrado')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=zzzz-sem-resultado');
    expect(total()).toHaveTextContent('0 contatos');
  });

  it('clears the filters from the empty state', async () => {
    const { user, router } = await renderApp('/contatos?q=zzzz-sem-resultado');
    await screen.findByText('Nenhum contato encontrado');

    const emptyState = screen.getByText('Nenhum contato encontrado').parentElement as HTMLElement;
    await user.click(within(emptyState).getByRole('button', { name: 'Limpar filtros' }));

    await waitFor(() => expect(total()).toHaveTextContent('180 contatos'));
    expect(router.state.location.search).toBe('');
    expect(screen.getByLabelText('Buscar contatos')).toHaveValue('');
  });

  it('goes to the next page and writes it to the URL', async () => {
    const { user, router } = await renderApp('/contatos');
    await waitFor(() => expect(rowsOf()).toHaveLength(25));

    const next = screen.getByRole('button', { name: /próxima página/i });
    await user.click(next);

    await waitFor(() => expect(router.state.location.search).toBe('?page=2'));
    await waitFor(() => expect(rowsOf()).toHaveLength(25));
  });

  it('sorts by a column and returns to the first page', async () => {
    const { user, router } = await renderApp('/contatos?page=3');
    await waitFor(() => expect(rowsOf()).toHaveLength(25));

    await user.click(screen.getByRole('columnheader', { name: /E-mail/ }));

    await waitFor(() => expect(router.state.location.search).toBe('?ordem=email'));
  });

  it('moves to the last page when the link points past the end', async () => {
    const { router } = await renderApp('/contatos?page=99');

    await waitFor(() => expect(router.state.location.search).toBe('?page=8'));
    await waitFor(() => expect(rowsOf()).toHaveLength(5));
  });

  it('offers a retry when the list fails to load', async () => {
    server.use(
      http.get('/api/contacts', () => HttpResponse.json({ message: 'x' }, { status: 500 })),
    );
    const { user } = await renderApp('/contatos');

    expect(await screen.findByText('Não foi possível carregar os contatos.')).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(total()).toHaveTextContent('180 contatos'));
  });
});
