import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './auth';
import { db } from './db';

const admin = db.users[0]!;

function readPayload(token: string) {
  const segment = token.split('.')[1]!;
  return JSON.parse(atob(segment.replaceAll('-', '+').replaceAll('_', '/')));
}

describe('mock tokens', () => {
  it('looks like a JWT and carries the user id, role and expiry', () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);
    const token = signToken(admin, now);

    expect(token.split('.')).toHaveLength(3);
    expect(readPayload(token)).toMatchObject({
      sub: admin.id,
      role: 'admin',
      iat: now / 1000,
      exp: now / 1000 + 8 * 60 * 60,
    });
  });

  it('verifies a fresh token and returns its user', () => {
    expect(verifyToken(signToken(admin))).toEqual(admin);
  });

  it('rejects an expired token', () => {
    const issued = Date.UTC(2026, 0, 1);
    const token = signToken(admin, issued, 60);
    expect(verifyToken(token, issued + 59_000)).toEqual(admin);
    expect(verifyToken(token, issued + 60_000)).toBeNull();
  });

  it('rejects garbage and tokens for users that no longer exist', () => {
    expect(verifyToken('not-a-token')).toBeNull();
    expect(verifyToken('a.b.c')).toBeNull();
    expect(verifyToken(signToken({ ...admin, id: 'usr_gone' }))).toBeNull();
  });
});
