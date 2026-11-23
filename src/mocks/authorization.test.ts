import { describe, expect, it } from 'vitest';
import { apiRequest } from '../api/client';
import { userSchema } from '../api/schemas';
import { tokenStore } from '../api/tokenStore';
import { requestLogin } from '../features/auth/api';
import { DEMO_PASSWORD } from '../features/auth/demoAccounts';
import { fetchCompanies } from '../features/companies/api';
import { fetchContact, fetchContacts } from '../features/contacts/api';
import { fetchUsers } from '../features/team/api';
import { signInAs } from '../test/session';
import { signToken, verifyToken } from './auth';
import { db } from './db';

const fetchMe = () => apiRequest('/auth/me', { schema: userSchema });

describe('POST /api/auth/login', () => {
  it('returns a token and the user for valid credentials', async () => {
    const { token, user } = await requestLogin({
      email: 'marina@minicrm.demo',
      password: DEMO_PASSWORD,
    });
    expect(user).toMatchObject({ id: 'usr_1', role: 'admin' });
    expect(verifyToken(token)).toEqual(user);
  });

  it('ignores case and surrounding spaces in the e-mail', async () => {
    const { user } = await requestLogin({
      email: '  RAFAEL@minicrm.demo ',
      password: DEMO_PASSWORD,
    });
    expect(user.id).toBe('usr_2');
  });

  it('answers the same 401 for a wrong password and an unknown e-mail', async () => {
    const expected = { status: 401, message: 'E-mail ou senha incorretos.' };
    await expect(
      requestLogin({ email: 'marina@minicrm.demo', password: 'errada' }),
    ).rejects.toMatchObject(expected);
    await expect(
      requestLogin({ email: 'ninguem@minicrm.demo', password: DEMO_PASSWORD }),
    ).rejects.toMatchObject(expected);
  });

  it('rejects a malformed request with 400', async () => {
    await expect(requestLogin({ email: 'nao-e-email', password: '' })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('sessions', () => {
  it('GET /api/auth/me returns the user behind the token', async () => {
    const user = signInAs('seller');
    await expect(fetchMe()).resolves.toEqual(user);
  });

  it('every protected endpoint answers 401 without a token', async () => {
    tokenStore.clear();
    for (const call of [
      fetchMe,
      fetchContacts,
      () => fetchContact('ct_1'),
      fetchCompanies,
      () => fetchUsers(),
    ]) {
      await expect(call()).rejects.toMatchObject({ status: 401 });
    }
  });

  it('answers 401 for an expired token', async () => {
    const user = db.users[0]!;
    tokenStore.set(signToken(user, Date.now() - 2 * 60 * 60 * 1000, 60 * 60));
    await expect(fetchContacts()).rejects.toMatchObject({
      status: 401,
      message: 'Sessão expirada. Entre novamente.',
    });
  });
});

describe('permissions', () => {
  it('lets the admin see every contact', async () => {
    signInAs('admin');
    await expect(fetchContacts()).resolves.toMatchObject({ total: 180 });
  });

  it('shows a seller only the contacts they own', async () => {
    const seller = signInAs('seller');
    const owned = db.contacts.filter((contact) => contact.ownerId === seller.id);

    const result = await fetchContacts({ pageSize: 100 });
    expect(result.total).toBe(owned.length);
    expect(owned.length).toBeGreaterThan(0);
    expect(owned.length).toBeLessThan(180);
    expect(result.data.every((contact) => contact.ownerId === seller.id)).toBe(true);
  });

  it("hides another seller's contact as if it did not exist", async () => {
    const seller = signInAs('seller');
    const mine = db.contacts.find((contact) => contact.ownerId === seller.id)!;
    const theirs = db.contacts.find((contact) => contact.ownerId !== seller.id)!;

    await expect(fetchContact(mine.id)).resolves.toMatchObject({ id: mine.id });
    await expect(fetchContact(theirs.id)).rejects.toMatchObject({ status: 404 });
  });

  it('keeps companies visible to every signed-in user', async () => {
    signInAs('seller');
    await expect(fetchCompanies()).resolves.toMatchObject({ total: 40 });
  });

  it('lists the team for the admin only', async () => {
    signInAs('admin');
    const team = await fetchUsers();
    expect(team.total).toBe(5);
    expect(team.data.map((user) => user.name)).toEqual(
      [...team.data.map((user) => user.name)].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    );

    signInAs('seller');
    await expect(fetchUsers()).rejects.toMatchObject({
      status: 403,
      message: 'Você não tem permissão para acessar este recurso.',
    });
  });
});
