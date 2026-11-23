import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/db';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });

type User = Awaited<ReturnType<typeof renderApp>>['user'];

async function pickCompany(user: User, name: string) {
  await user.click(screen.getByRole('combobox', { name: /Empresa/ }));
  const [option] = await screen.findAllByRole('option', { name });
  if (!option) throw new Error(`no option ${name}`);
  await user.click(option);
}

async function fillForm(
  user: User,
  values: { name: string; email: string; phone?: string; jobTitle?: string },
) {
  await user.type(screen.getByLabelText(/Nome/), values.name);
  await user.type(screen.getByLabelText(/E-mail/), values.email);
  if (values.phone) await user.type(screen.getByLabelText('Telefone'), values.phone);
  if (values.jobTitle) await user.type(screen.getByLabelText('Cargo'), values.jobTitle);
}

const firstCompany = () => {
  const company = db.companies[0];
  if (!company) throw new Error('empty seed');
  return company;
};

describe('new contact', () => {
  it('opens from the list button', async () => {
    const { user } = await renderApp('/contatos');
    await user.click(await screen.findByRole('link', { name: 'Novo contato' }));
    expect(await heading('Novo contato')).toBeInTheDocument();
  });

  it('shows every problem at once and sends nothing when the form is empty', async () => {
    let requests = 0;
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') requests += 1;
    });
    const { user } = await renderApp('/contatos/novo');

    await user.click(screen.getByRole('button', { name: 'Criar contato' }));

    expect(await screen.findByText('Informe o nome (mínimo 2 letras).')).toBeInTheDocument();
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Escolha a empresa.')).toBeInTheDocument();
    expect(requests).toBe(0);
    // Keyboard users land on the first problem.
    expect(screen.getByLabelText(/Nome/)).toHaveFocus();
    expect(screen.getByLabelText(/Nome/)).toBeInvalid();
  });

  it('validates the phone only when one is typed', async () => {
    const { user } = await renderApp('/contatos/novo');
    await user.type(screen.getByLabelText('Telefone'), '123');
    await user.click(screen.getByRole('button', { name: 'Criar contato' }));

    expect(await screen.findByText(/Informe o telefone com DDD/)).toBeInTheDocument();
  });

  it('creates the contact, shows it, and counts it in the list', async () => {
    const { user, router } = await renderApp('/contatos/novo');
    const company = firstCompany();

    await fillForm(user, {
      name: 'Beatriz Lima',
      email: 'beatriz.lima@exemplo.com.br',
      jobTitle: 'CTO',
    });
    await pickCompany(user, company.name);
    await user.click(screen.getByRole('button', { name: 'Criar contato' }));

    expect(await heading('Beatriz Lima')).toBeInTheDocument();
    expect(screen.getByText('Contato criado.')).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/contatos\/ct_/);
    expect(db.contacts).toHaveLength(181);

    await user.click(screen.getByRole('link', { name: 'Voltar para contatos' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('181 contatos'));
  });

  it('shows "e-mail already used" on the e-mail field and keeps what was typed', async () => {
    const { user } = await renderApp('/contatos/novo');
    const existing = db.contacts[0];
    if (!existing) throw new Error('empty seed');

    await fillForm(user, { name: 'Alguém Novo', email: existing.email });
    await pickCompany(user, firstCompany().name);
    await user.click(screen.getByRole('button', { name: 'Criar contato' }));

    expect(await screen.findByText('Já existe um contato com este e-mail.')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toHaveFocus();
    expect(screen.getByLabelText(/Nome/)).toHaveValue('Alguém Novo');
    expect(db.contacts).toHaveLength(180);
  });

  it('shows a general error and lets the user try again when the server fails', async () => {
    server.use(
      http.post('/api/contacts', () =>
        HttpResponse.json({ message: 'Falha interna.' }, { status: 500 }),
      ),
    );
    const { user } = await renderApp('/contatos/novo');

    await fillForm(user, { name: 'Beatriz Lima', email: 'beatriz.lima@exemplo.com.br' });
    await pickCompany(user, firstCompany().name);
    await user.click(screen.getByRole('button', { name: 'Criar contato' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha interna.');

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Criar contato' }));
    expect(await heading('Beatriz Lima')).toBeInTheDocument();
  });

  it('explains a connection problem in plain words', async () => {
    server.use(http.post('/api/contacts', () => HttpResponse.error()));
    const { user } = await renderApp('/contatos/novo');

    await fillForm(user, { name: 'Beatriz Lima', email: 'beatriz.lima@exemplo.com.br' });
    await pickCompany(user, firstCompany().name);
    await user.click(screen.getByRole('button', { name: 'Criar contato' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Verifique a conexão');
  });

  it('cancels back to the list with its filters', async () => {
    const { user, router } = await renderApp('/contatos?q=ana');
    await user.click(await screen.findByRole('link', { name: 'Novo contato' }));
    await heading('Novo contato');

    await user.click(screen.getByRole('link', { name: 'Cancelar' }));

    expect(await heading('Contatos')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=ana');
  });
});

describe('edit contact', () => {
  const target = () => {
    const contact = db.contacts[0];
    if (!contact) throw new Error('empty seed');
    return contact;
  };

  it('opens from the detail page with the current values filled in', async () => {
    const { user } = await renderApp(`/contatos/${target().id}`);
    await user.click(await screen.findByRole('link', { name: 'Editar' }));

    expect(await heading(`Editar ${target().name}`)).toBeInTheDocument();
    await screen.findByRole('form', { name: 'Dados do contato' });
    expect(screen.getByLabelText(/Nome/)).toHaveValue(target().name);
    expect(screen.getByLabelText(/E-mail/)).toHaveValue(target().email);
    // The company name appears once the list of companies has loaded.
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /Empresa/ })).toHaveValue(
        db.companies.find((company) => company.id === target().companyId)?.name,
      ),
    );
  });

  it('saves the changes and shows them on the detail page', async () => {
    const { user } = await renderApp(`/contatos/${target().id}/editar`);
    await screen.findByRole('form', { name: 'Dados do contato' });

    const jobTitle = screen.getByLabelText('Cargo');
    await user.clear(jobTitle);
    await user.type(jobTitle, 'Diretor de Operações');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await heading(target().name)).toBeInTheDocument();
    expect(screen.getByText('Alterações salvas.')).toBeInTheDocument();
    expect(screen.getByText(/Diretor de Operações/)).toBeInTheDocument();
    expect(target().jobTitle).toBe('Diretor de Operações');
  });

  it('can keep the same e-mail (it is not a duplicate of itself)', async () => {
    const { user } = await renderApp(`/contatos/${target().id}/editar`);
    await screen.findByRole('form', { name: 'Dados do contato' });

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await heading(target().name)).toBeInTheDocument();
  });

  it('keeps the user on the form when the e-mail belongs to someone else', async () => {
    const other = db.contacts[1];
    if (!other) throw new Error('empty seed');
    const { user } = await renderApp(`/contatos/${target().id}/editar`);
    await screen.findByRole('form', { name: 'Dados do contato' });

    const email = screen.getByLabelText(/E-mail/);
    await user.clear(email);
    await user.type(email, other.email);
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Já existe um contato com este e-mail.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Editar');
  });

  it('says so when the contact does not exist or belongs to another seller', async () => {
    await renderApp('/contatos/nao-existe/editar');
    expect(await heading('Contato não encontrado')).toBeInTheDocument();
  });

  it("does not let a seller edit someone else's contact", async () => {
    const other = db.contacts.find((contact) => contact.ownerId !== 'usr_2');
    if (!other) throw new Error('seed has no other owner');
    await renderApp(`/contatos/${other.id}/editar`, { as: 'seller' });

    expect(await heading('Contato não encontrado')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome/)).not.toBeInTheDocument();
  });

  it('cancels back to the detail page without saving', async () => {
    const { user } = await renderApp(`/contatos/${target().id}/editar`);
    await screen.findByRole('form', { name: 'Dados do contato' });
    await user.type(screen.getByLabelText('Cargo'), ' alterado');

    await user.click(screen.getByRole('link', { name: 'Cancelar' }));

    expect(await heading(target().name)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).queryByText(/alterado/)).not.toBeInTheDocument();
  });
});

describe('list filters survive the form round trips', () => {
  it('keeps the list filters after creating a contact', async () => {
    const { user, router } = await renderApp('/contatos?q=ana');
    await user.click(await screen.findByRole('link', { name: 'Novo contato' }));
    await heading('Novo contato');
    await fillForm(user, { name: 'Beatriz Lima', email: 'beatriz.lima@exemplo.com.br' });
    await pickCompany(user, firstCompany().name);
    await user.click(screen.getByRole('button', { name: 'Criar contato' }));
    await heading('Beatriz Lima');

    await user.click(screen.getByRole('link', { name: 'Voltar para contatos' }));

    expect(await heading('Contatos')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=ana');
  });

  it('keeps the list filters after editing a contact', async () => {
    const contact = db.contacts[0];
    if (!contact) throw new Error('empty seed');
    const { user, router } = await renderApp(`/contatos?q=${encodeURIComponent(contact.name)}`);
    await user.click(await screen.findByRole('link', { name: contact.name }));
    await user.click(await screen.findByRole('link', { name: 'Editar' }));
    await user.click(await screen.findByRole('button', { name: 'Salvar alterações' }));
    await screen.findByText('Alterações salvas.');

    await user.click(screen.getByRole('link', { name: 'Voltar para contatos' }));

    expect(await heading('Contatos')).toBeInTheDocument();
    expect(router.state.location.search).toBe(`?q=${encodeURIComponent(contact.name)}`);
  });
});
