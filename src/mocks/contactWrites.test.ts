import { describe, expect, it } from 'vitest';
import { apiRequest } from '../api/client';
import { contactResponseSchema, type ContactInput } from '../api/schemas';
import { createContact, updateContact } from '../features/contacts/api';
import { signInAs } from '../test/session';
import { db } from './db';

const company = () => {
  const found = db.companies[0];
  if (!found) throw new Error('empty seed');
  return found;
};

const input = (overrides: Partial<ContactInput> = {}): ContactInput => ({
  name: 'Novo Contato',
  email: 'novo.contato@exemplo.com.br',
  phone: '(11) 91234-5678',
  jobTitle: 'Gerente',
  companyId: company().id,
  ...overrides,
});

describe('POST /api/contacts', () => {
  it('requires a signed-in user', async () => {
    await expect(createContact(input())).rejects.toMatchObject({ status: 401 });
  });

  it('creates a contact owned by whoever creates it', async () => {
    signInAs('seller');
    const created = await createContact(input());

    expect(created).toMatchObject({ name: 'Novo Contato', ownerId: 'usr_2' });
    expect(created.company).toEqual({ id: company().id, name: company().name });
    expect(db.contacts.some((contact) => contact.id === created.id)).toBe(true);
    // It is immediately readable through the API.
    await expect(
      apiRequest(`/contacts/${created.id}`, { schema: contactResponseSchema }),
    ).resolves.toMatchObject({ id: created.id });
  });

  it('rejects invalid data with 422', async () => {
    signInAs('admin');
    await expect(createContact(input({ email: 'sem-arroba' }))).rejects.toMatchObject({
      status: 422,
    });
  });

  it('rejects an unknown company with 422', async () => {
    signInAs('admin');
    await expect(createContact(input({ companyId: 'nao-existe' }))).rejects.toMatchObject({
      status: 422,
      message: 'Empresa não encontrada.',
    });
  });

  it('rejects a repeated e-mail (ignoring case) with 409', async () => {
    signInAs('admin');
    const existing = db.contacts[0];
    if (!existing) throw new Error('empty seed');
    await expect(
      createContact(input({ email: existing.email.toUpperCase() })),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Já existe um contato com este e-mail.',
    });
  });
});

describe('PATCH /api/contacts/:id', () => {
  it('updates a contact and keeps its owner', async () => {
    signInAs('admin');
    const target = db.contacts[0];
    if (!target) throw new Error('empty seed');
    const owner = target.ownerId;

    const updated = await updateContact(
      target.id,
      input({ email: target.email, jobTitle: 'Nova função' }),
    );

    expect(updated.jobTitle).toBe('Nova função');
    expect(updated.ownerId).toBe(owner);
  });

  it('answers 404 for a contact that does not exist', async () => {
    signInAs('admin');
    await expect(updateContact('nao-existe', input())).rejects.toMatchObject({ status: 404 });
  });

  it("answers 404 when a seller edits someone else's contact", async () => {
    signInAs('seller');
    const other = db.contacts.find((contact) => contact.ownerId !== 'usr_2');
    if (!other) throw new Error('seed has no other owner');
    await expect(updateContact(other.id, input())).rejects.toMatchObject({ status: 404 });
  });

  it('rejects an e-mail that belongs to another contact with 409', async () => {
    signInAs('admin');
    const [first, second] = db.contacts;
    if (!first || !second) throw new Error('empty seed');
    await expect(updateContact(first.id, input({ email: second.email }))).rejects.toMatchObject({
      status: 409,
    });
  });
});
