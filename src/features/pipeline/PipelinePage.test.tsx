import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/db';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';
import { stageLabels } from '../deals/labels';

const column = (name: string) => screen.findByRole('region', { name: new RegExp(`^${name}`) });
const dealsIn = (stage: string) => db.deals.filter((deal) => deal.stage === stage);

const firstNewDeal = () => {
  const deal = dealsIn('novo')[0];
  if (!deal) throw new Error('seed has no new deal');
  return deal;
};

async function moveVia(
  user: Awaited<ReturnType<typeof renderApp>>['user'],
  title: string,
  to: string,
) {
  await user.click(await screen.findByRole('button', { name: `Mover ${title}` }));
  await user.click(await screen.findByRole('menuitem', { name: to }));
}

describe('funnel board', () => {
  it('shows one column per stage with its deals, count and total', async () => {
    await renderApp('/funil');

    for (const [stage, label] of Object.entries(stageLabels)) {
      const region = await column(label);
      expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(
        dealsIn(stage).length,
      );
    }
    expect(await screen.findByText(new RegExp(`^${db.deals.length} negócios`))).toBeInTheDocument();
  });

  it('shows a seller only their own deals', async () => {
    await renderApp('/funil', { as: 'seller' });

    const mine = db.deals.filter((deal) => deal.ownerId === 'usr_2');
    await screen.findByText(new RegExp(`^${mine.length} negócios`));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(mine.length);
  });

  it('links each card to its contact', async () => {
    await renderApp('/funil');
    const deal = firstNewDeal();
    const contact = db.contacts.find((item) => item.id === deal.contactId);

    const region = await column('Novo');
    const links = within(region).getAllByRole('link', { name: contact?.name });
    expect(links[0]).toHaveAttribute('href', `/contatos/${deal.contactId}`);
  });

  it('moves a card through its menu: the card changes column at once and the server keeps it', async () => {
    const { user } = await renderApp('/funil');
    const deal = firstNewDeal();
    const before = dealsIn('proposta').length;

    await moveVia(user, deal.title, 'Proposta');

    // Optimistic: the target column grows without waiting for the server.
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: /^Proposta/ })).getAllByRole('heading', {
          level: 3,
        }),
      ).toHaveLength(before + 1),
    );
    await waitFor(() =>
      expect(db.deals.find((item) => item.id === deal.id)?.stage).toBe('proposta'),
    );
  });

  it('moves the card before the server has answered', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.patch('/api/deals/:id', async () => {
        await gate;
        return HttpResponse.json({ message: 'x' }, { status: 500 });
      }),
    );
    const { user } = await renderApp('/funil');
    const deal = firstNewDeal();

    await moveVia(user, deal.title, 'Perdido');

    // The request is still pending, yet the card is already in its new column.
    const lost = await column('Perdido');
    expect(within(lost).getByRole('heading', { level: 3, name: deal.title })).toBeInTheDocument();

    release();
    // The server refuses, so it goes back.
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: /^Perdido/ })).queryByRole('heading', {
          level: 3,
          name: deal.title,
        }),
      ).not.toBeInTheDocument(),
    );
  });

  it('puts the card back and explains when the server refuses', async () => {
    server.use(
      http.patch('/api/deals/:id', () => HttpResponse.json({ message: 'x' }, { status: 500 })),
    );
    const { user } = await renderApp('/funil');
    const deal = firstNewDeal();
    const before = dealsIn('novo').length;

    await moveVia(user, deal.title, 'Ganho');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Não foi possível mover “${deal.title}” para Ganho. O negócio voltou para Novo.`,
    );
    const region = await column('Novo');
    expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(before);
    expect(within(region).getByRole('heading', { level: 3, name: deal.title })).toBeInTheDocument();
  });

  it('does not offer the current stage as a destination', async () => {
    const { user } = await renderApp('/funil');
    await user.click(await screen.findByRole('button', { name: `Mover ${firstNewDeal().title}` }));

    expect(await screen.findByRole('menuitem', { name: 'Novo' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'Ganho' })).not.toHaveAttribute('aria-disabled');
  });

  it('offers a retry when the board fails to load', async () => {
    server.use(http.get('/api/deals', () => HttpResponse.json({ message: 'x' }, { status: 500 })));
    const { user } = await renderApp('/funil');

    expect(await screen.findByText('Não foi possível carregar o funil.')).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await column('Novo');
  });
});
