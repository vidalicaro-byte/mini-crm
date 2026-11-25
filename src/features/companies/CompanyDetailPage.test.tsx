import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/db';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });
const region = (name: string) => screen.getByRole('region', { name });

/** A company with contacts and deals, so every section has something to show. */
function busyCompany() {
  const company = db.companies.find(
    (item) =>
      db.contacts.some((contact) => contact.companyId === item.id) &&
      db.deals.some((deal) => deal.companyId === item.id),
  );
  if (!company) throw new Error('seed has no company with contacts and deals');
  return company;
}

describe('company detail', () => {
  it('shows the data, the summary, the contacts and the deals', async () => {
    const company = busyCompany();
    await renderApp(`/empresas/${company.id}`);

    await heading(company.name);
    const info = region('Informações');
    expect(within(info).getByText(`${company.city} – ${company.state}`)).toBeInTheDocument();
    expect(within(info).getByRole('link', { name: /^www\./ })).toHaveAttribute(
      'href',
      company.website,
    );
    expect(within(info).getByRole('link', { name: /^www\./ })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );

    const contacts = db.contacts.filter((contact) => contact.companyId === company.id);
    const contactsSection = region('Contatos');
    expect(await within(contactsSection).findAllByRole('listitem')).toHaveLength(contacts.length);
    expect(within(region('Resumo')).getByText(String(contacts.length))).toBeInTheDocument();

    const deals = db.deals.filter((deal) => deal.companyId === company.id);
    expect(await within(region('Negócios')).findAllByRole('listitem')).toHaveLength(deals.length);
  });

  it('links each contact to its page', async () => {
    const company = busyCompany();
    const contact = db.contacts.find((item) => item.companyId === company.id)!;
    const { user, router } = await renderApp(`/empresas/${company.id}`);

    await user.click(await screen.findByRole('link', { name: contact.name }));

    expect(await heading(contact.name)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/contatos/${contact.id}`);
  });

  it('sends "see all" to the contact list filtered by this company', async () => {
    const company = busyCompany();
    // Give the company more contacts than the page shows.
    const template = db.contacts.find((contact) => contact.companyId === company.id)!;
    for (let i = 0; i < 12; i += 1) {
      db.contacts.push({ ...template, id: `ct_extra_${i}`, email: `extra${i}@teste.dev` });
    }
    const { user, router } = await renderApp(`/empresas/${company.id}`);
    await heading(company.name);

    const total = db.contacts.filter((contact) => contact.companyId === company.id).length;
    const section = region('Contatos');
    await waitFor(() => expect(within(section).getAllByRole('listitem')).toHaveLength(10));
    await user.click(within(section).getByRole('link', { name: `Ver todos os ${total} contatos` }));

    expect(await heading('Contatos')).toBeInTheDocument();
    expect(router.state.location.search).toBe(`?empresa=${company.id}`);
  });

  it('shows a seller only their own contacts of the company', async () => {
    // A company where the seller has contacts and so does somebody else.
    const company = db.companies.find(
      (item) =>
        db.contacts.some((c) => c.companyId === item.id && c.ownerId === 'usr_2') &&
        db.contacts.some((c) => c.companyId === item.id && c.ownerId !== 'usr_2'),
    );
    if (!company) throw new Error('seed has no company shared by the seller and someone else');
    await renderApp(`/empresas/${company.id}`, { as: 'seller' });

    await heading(company.name);
    const mine = db.contacts.filter((c) => c.companyId === company.id && c.ownerId === 'usr_2');
    const theirs = db.contacts.find((c) => c.companyId === company.id && c.ownerId !== 'usr_2')!;
    expect(await within(region('Contatos')).findAllByRole('listitem')).toHaveLength(mine.length);
    expect(screen.queryByText(theirs.name)).not.toBeInTheDocument();
  });

  it('says so when the company does not exist', async () => {
    await renderApp('/empresas/nao-existe');

    expect(await heading('Empresa não encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para empresas' })).toHaveAttribute(
      'href',
      '/empresas',
    );
  });

  it('offers a retry when the company fails to load', async () => {
    server.use(
      http.get('/api/companies/:id', () => HttpResponse.json({ message: 'x' }, { status: 500 })),
    );
    const company = busyCompany();
    const { user } = await renderApp(`/empresas/${company.id}`);

    expect(await screen.findByText('Não foi possível carregar a empresa.')).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await heading(company.name)).toBeInTheDocument();
  });

  it('shows an error only in the section that failed', async () => {
    server.use(http.get('/api/deals', () => HttpResponse.json({ message: 'x' }, { status: 500 })));
    const company = busyCompany();
    await renderApp(`/empresas/${company.id}`);

    expect(await screen.findByText('Não foi possível carregar os negócios.')).toBeInTheDocument();
    await waitFor(() =>
      expect(within(region('Contatos')).queryByRole('alert')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { level: 1, name: company.name })).toBeInTheDocument();
  });

  it('is reachable from the contact it belongs to', async () => {
    const contact = db.contacts[0]!;
    const company = db.companies.find((item) => item.id === contact.companyId)!;
    const { user, router } = await renderApp(`/contatos/${contact.id}`);

    await heading(contact.name);
    await user.click(within(region('Informações')).getByRole('link', { name: company.name }));

    expect(await heading(company.name)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/empresas/${company.id}`);
  });
});
