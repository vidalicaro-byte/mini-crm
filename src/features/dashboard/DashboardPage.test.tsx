import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/db';
import { computeOverview } from '../../mocks/overview';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';
import { formatCurrency } from '../deals/labels';

// Intl puts a non-breaking space after "R$"; Testing Library turns it into a plain space in the
// page text but not in the string it is given.
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ');
const main = () => within(screen.getByRole('main'));
const kpi = (label: string) => main().getByText(label).closest('.MuiCard-root') as HTMLElement;

describe('overview', () => {
  it('shows the key numbers for the default period (30 days)', async () => {
    await renderApp('/');
    const expected = computeOverview(db, { id: 'usr_1', role: 'admin' }, '30d');

    await waitFor(() =>
      expect(
        within(kpi('Novos contatos')).getByText(String(expected.newContacts.current)),
      ).toBeInTheDocument(),
    );
    expect(within(kpi('Contatos')).getByText('180')).toBeInTheDocument();
    expect(within(kpi('Contatos')).getByText('em 40 empresas')).toBeInTheDocument();
    expect(
      within(kpi('Receita ganha')).getByText(money(expected.wonRevenue.current)),
    ).toBeInTheDocument();
    expect(
      within(kpi('Negócios em aberto')).getByText(String(expected.openDeals.count)),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('compares with the period before, in words for screen readers', async () => {
    await renderApp('/');

    const card = kpi('Novos contatos');
    const chip = await within(card).findByLabelText(/período anterior/);
    expect(chip.getAttribute('aria-label')).toMatch(
      /^(Aumento|Queda) de \d+% em relação ao período anterior\.$|^Igual|^Sem dados/,
    );
  });

  it('changes the period, keeps it in the URL and goes back to a clean URL for the default', async () => {
    const { user, router } = await renderApp('/');
    await screen.findByText('180');

    await user.click(screen.getByRole('button', { name: '90 dias' }));
    expect(router.state.location.search).toBe('?periodo=90d');
    expect(screen.getByRole('button', { name: '90 dias' })).toHaveAttribute('aria-pressed', 'true');
    const expected = computeOverview(db, { id: 'usr_1', role: 'admin' }, '90d');
    await waitFor(() =>
      expect(
        within(kpi('Novos contatos')).getByText(String(expected.newContacts.current)),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: '30 dias' }));
    expect(router.state.location.search).toBe('');
  });

  it('opens straight on the period from a shared link, and ignores nonsense', async () => {
    await renderApp('/?periodo=7d');
    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('falls back to 30 days for an unknown period', async () => {
    await renderApp('/?periodo=ontem');
    expect(screen.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the old numbers, marked as busy, while a new period loads', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { user } = await renderApp('/');
    await screen.findByText('180');
    server.use(
      http.get('/api/overview', async ({ request }) => {
        if (new URL(request.url).searchParams.get('period') === '7d') await gate;
        return HttpResponse.json(
          computeOverview(
            db,
            { id: 'usr_1', role: 'admin' },
            new URL(request.url).searchParams.get('period') as '7d',
          ),
        );
      }),
    );

    await user.click(screen.getByRole('button', { name: '7 dias' }));

    await waitFor(() =>
      expect(screen.getByText('180').closest('[aria-busy="true"]')).not.toBeNull(),
    );
    release();
    await waitFor(() => expect(screen.getByText('180').closest('[aria-busy="true"]')).toBeNull());
  });

  it('describes each chart in words and offers its data as a table', async () => {
    await renderApp('/');

    const funnel = await screen.findByRole('region', { name: 'Negócios criados por etapa' });
    expect(within(funnel).getByText(/negócios criados no período/)).toBeInTheDocument();
    const [table] = within(funnel).getAllByRole('table', { hidden: true });
    // Header plus one row per stage.
    expect(within(table as HTMLElement).getAllByRole('row', { hidden: true })).toHaveLength(7);

    const revenue = screen.getByRole('region', { name: 'Receita ganha' });
    expect(
      within(revenue).getByText(/em negócios ganhos no período, por dia\./),
    ).toBeInTheDocument();
  });

  it('shows a dash instead of a rate when no deal was closed', async () => {
    server.use(
      http.get('/api/overview', ({ request }) => {
        const overview = computeOverview(db, { id: 'usr_1', role: 'admin' }, '30d');
        return HttpResponse.json({
          ...overview,
          period: new URL(request.url).searchParams.get('period'),
          conversionRate: { current: null, previous: null },
        });
      }),
    );
    await renderApp('/');

    const card = kpi('Taxa de conversão');
    expect(await within(card).findByText('—')).toBeInTheDocument();
    expect(within(card).getByText('Nenhum negócio fechado no período')).toBeInTheDocument();
  });

  it('shows an error with a retry button, and recovers when the retry succeeds', async () => {
    server.use(
      http.get('/api/overview', () => HttpResponse.json({ message: 'Falha' }, { status: 500 })),
    );
    const { user } = await renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a visão geral.',
    );

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('180')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('updates after a deal is won on the funnel', async () => {
    const { user } = await renderApp('/');
    const admin = { id: 'usr_1', role: 'admin' };
    const before = computeOverview(db, admin, '30d').wonRevenue.current;
    await screen.findByText(money(before));
    const deal = db.deals.find((item) => item.stage === 'novo');
    if (!deal) throw new Error('seed has no new deal');

    const nav = screen.getByRole('navigation', { name: 'Principal' });
    await user.click(within(nav).getByRole('link', { name: 'Funil' }));
    await user.click(await screen.findByRole('button', { name: `Mover ${deal.title}` }));
    await user.click(await screen.findByRole('menuitem', { name: 'Ganho' }));
    await waitFor(() => expect(db.deals.find((item) => item.id === deal.id)?.stage).toBe('ganho'));
    await user.click(within(nav).getByRole('link', { name: 'Visão geral' }));

    expect(await screen.findByText(money(before + deal.value))).toBeInTheDocument();
  });
});
