import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/db';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';

const rowsOf = () => within(screen.getByRole('grid')).getAllByRole('row').slice(1);
const total = () => screen.getByRole('status');
const cell = (row: HTMLElement, index: number) =>
  within(row).getAllByRole('gridcell')[index]?.textContent ?? '';

describe('companies list', () => {
  it('shows the first page of companies with the total', async () => {
    await renderApp('/empresas');

    await waitFor(() => expect(total()).toHaveTextContent('40 empresas'));
    expect(await screen.findByRole('grid', { name: 'Lista de empresas' })).toBeInTheDocument();
    expect(rowsOf()).toHaveLength(25);
  });

  it('is reachable from the menu', async () => {
    const { user, router } = await renderApp('/');
    const nav = screen.getByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getByRole('link', { name: 'Empresas' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Empresas' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/empresas');
  });

  it('shows the same companies to a seller', async () => {
    await renderApp('/empresas', { as: 'seller' });
    await waitFor(() => expect(total()).toHaveTextContent('40 empresas'));
  });

  it('reads the size filter from the URL', async () => {
    const large = db.companies.filter((company) => company.size === 'grande').length;
    await renderApp('/empresas?porte=grande&tamanho=50');

    await waitFor(() => expect(total()).toHaveTextContent(`${large} empresas`));
    expect(rowsOf().every((row) => cell(row, 2) === 'Grande')).toBe(true);
  });

  it('filters by size from the select and keeps it in the URL', async () => {
    const small = db.companies.filter((company) => company.size === 'pequena').length;
    const { user, router } = await renderApp('/empresas');
    await waitFor(() => expect(total()).toHaveTextContent('40 empresas'));

    await user.click(screen.getByRole('combobox', { name: 'Porte' }));
    await user.click(await screen.findByRole('option', { name: 'Pequena' }));

    await waitFor(() => expect(router.state.location.search).toBe('?porte=pequena'));
    await waitFor(() => expect(total()).toHaveTextContent(`${small} empresas`));
  });

  it('searches on the server after a pause and clears from the empty state', async () => {
    const { user, router } = await renderApp('/empresas');
    await waitFor(() => expect(total()).toHaveTextContent('40 empresas'));

    await user.type(screen.getByLabelText('Buscar empresas'), 'zzzz-sem-resultado');

    expect(await screen.findByText('Nenhuma empresa encontrada')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=zzzz-sem-resultado');

    const emptyState = screen.getByText('Nenhuma empresa encontrada').parentElement as HTMLElement;
    await user.click(within(emptyState).getByRole('button', { name: 'Limpar filtros' }));

    await waitFor(() => expect(total()).toHaveTextContent('40 empresas'));
    expect(router.state.location.search).toBe('');
    expect(screen.getByLabelText('Buscar empresas')).toHaveValue('');
  });

  it("shows each company's contacts and open deals", async () => {
    const withDeals = db.companies.find((company) =>
      db.deals.some((deal) => deal.companyId === company.id && deal.stage === 'negociacao'),
    );
    if (!withDeals) throw new Error('seed has no company with a deal in negotiation');
    await renderApp(`/empresas?q=${encodeURIComponent(withDeals.name)}&tamanho=50`);

    const link = await screen.findByRole('link', { name: withDeals.name });
    const row = link.closest('[role="row"]') as HTMLElement;
    const contacts = db.contacts.filter((contact) => contact.companyId === withDeals.id).length;
    expect(cell(row, 4)).toBe(String(contacts));
    // The value is shown as currency; a company with no open deal would show a dash.
    expect(cell(row, 5).replace(/\s/g, ' ')).toMatch(/^R\$ [\d.]+,\d{2}$/);
  });

  it('sorts by a column and returns to the first page', async () => {
    const { user, router } = await renderApp('/empresas?page=2');
    await waitFor(() => expect(rowsOf()).toHaveLength(15));

    await user.click(screen.getByRole('columnheader', { name: /Contatos/ }));

    await waitFor(() => expect(router.state.location.search).toBe('?ordem=contactsCount'));
  });

  it('opens a company and goes back to the same filtered view', async () => {
    const { user, router } = await renderApp('/empresas?porte=grande&tamanho=10');
    const first = rowsOf;
    await waitFor(() => expect(first()).toHaveLength(10));
    const link = within(rowsOf()[0] as HTMLElement).getByRole('link');
    const name = link.textContent ?? '';

    await user.click(link);

    expect(await screen.findByRole('heading', { level: 1, name })).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/empresas\/.+/);

    await user.click(screen.getByRole('link', { name: 'Voltar para empresas' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Empresas' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?porte=grande&tamanho=10');
  });

  it('offers a retry when the list fails to load', async () => {
    server.use(
      http.get('/api/companies', () => HttpResponse.json({ message: 'x' }, { status: 500 })),
    );
    const { user } = await renderApp('/empresas');

    expect(await screen.findByText('Não foi possível carregar as empresas.')).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(total()).toHaveTextContent('40 empresas'));
  });
});
