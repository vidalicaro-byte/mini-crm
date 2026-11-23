import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/db';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });

describe('contact detail', () => {
  it('opens from the list and goes back to the same filtered view', async () => {
    const { user, router } = await renderApp('/contatos?q=ana&tamanho=10');
    const link = await screen.findByRole('link', { name: 'Ana Júlia Braga' });

    await user.click(link);

    expect(await heading('Ana Júlia Braga')).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/contatos\/.+/);

    await user.click(screen.getByRole('link', { name: 'Voltar para contatos' }));
    expect(await heading('Contatos')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=ana&tamanho=10');
  });

  it('shows contact data, deals and the activity history (newest first)', async () => {
    const contact = db.contacts.find(
      (item) => db.activities.filter((activity) => activity.contactId === item.id).length >= 2,
    );
    if (!contact) throw new Error('seed has no contact with activities');
    await renderApp(`/contatos/${contact.id}`);

    await heading(contact.name);
    const info = screen.getByRole('region', { name: 'Informações' });
    expect(within(info).getByRole('link', { name: contact.email })).toHaveAttribute(
      'href',
      `mailto:${contact.email}`,
    );

    const history = screen.getByRole('region', { name: 'Histórico de atividades' });
    const items = await within(history).findAllByRole('listitem');
    const expected = db.activities.filter((activity) => activity.contactId === contact.id);
    expect(items).toHaveLength(expected.length);

    const dates = within(history)
      .getAllByText((_text, element) => element?.tagName === 'TIME')
      .map((time) => time.getAttribute('datetime') ?? '');
    expect(dates).toEqual([...dates].sort().reverse());

    expect(screen.getByRole('region', { name: 'Negócios' })).toBeInTheDocument();
  });

  it('says so when the contact does not exist', async () => {
    await renderApp('/contatos/nao-existe');

    expect(await heading('Contato não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para contatos' })).toHaveAttribute(
      'href',
      '/contatos',
    );
  });

  it("does not reveal another seller's contact", async () => {
    const others = db.contacts.find((contact) => contact.ownerId !== 'usr_2');
    if (!others) throw new Error('seed has no contact owned by someone else');
    await renderApp(`/contatos/${others.id}`, { as: 'seller' });

    expect(await heading('Contato não encontrado')).toBeInTheDocument();
    expect(screen.queryByText(others.email)).not.toBeInTheDocument();
  });

  it('offers a retry when the contact fails to load', async () => {
    server.use(
      http.get('/api/contacts/:id', () => HttpResponse.json({ message: 'x' }, { status: 500 })),
    );
    const contact = db.contacts[0];
    if (!contact) throw new Error('empty seed');
    const { user } = await renderApp(`/contatos/${contact.id}`);

    expect(await screen.findByText('Não foi possível carregar o contato.')).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await heading(contact.name)).toBeInTheDocument();
  });

  it('shows an error only in the section that failed', async () => {
    server.use(
      http.get('/api/activities', () => HttpResponse.json({ message: 'x' }, { status: 500 })),
    );
    const contact = db.contacts[0];
    if (!contact) throw new Error('empty seed');
    await renderApp(`/contatos/${contact.id}`);

    expect(await screen.findByText('Não foi possível carregar o histórico.')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: 'Negócios' })).queryByRole('alert'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { level: 1, name: contact.name })).toBeInTheDocument();
  });
});
