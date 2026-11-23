import { tokenStore } from '../api/tokenStore';
import { signToken } from '../mocks/auth';
import { db } from '../mocks/db';

export type TestUser = 'admin' | 'seller';

const testUserIds: Record<TestUser, string> = { admin: 'usr_1', seller: 'usr_2' };

/** Stores a valid session token for a demo user, as if they had already signed in. */
export function signInAs(role: TestUser) {
  const user = db.users.find((item) => item.id === testUserIds[role]);
  if (!user) throw new Error(`Test user not found: ${role}`);
  tokenStore.set(signToken(user));
  return user;
}
