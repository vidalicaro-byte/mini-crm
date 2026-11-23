import { HttpResponse } from 'msw';
import type { User } from '../api/schemas';
import { db } from './db';

/**
 * Fake JWT for the mock API: header.payload.signature, base64url-encoded like the real thing,
 * with `sub`, `role`, `iat` and `exp` claims. The signature is a placeholder, so this offers
 * no security: it only lets the app handle tokens (expiry, 401s) the way it would with a
 * real backend.
 */
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function encode(value: object) {
  return btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decode(segment: string): unknown {
  const base64 = segment.replaceAll('-', '+').replaceAll('_', '/');
  return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
}

export function signToken(user: User, now = Date.now(), ttlSeconds = TOKEN_TTL_SECONDS) {
  const issuedAt = Math.floor(now / 1000);
  const header = encode({ alg: 'none', typ: 'JWT' });
  const payload = encode({
    sub: user.id,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  });
  return `${header}.${payload}.mock-signature`;
}

/** Returns the user a token belongs to, or null if it is malformed, expired or unknown. */
export function verifyToken(token: string, now = Date.now()): User | null {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) return null;
    const payload = decode(payloadSegment) as { sub?: unknown; exp?: unknown };
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 <= now) return null;
    return db.users.find((user) => user.id === payload.sub) ?? null;
  } catch {
    return null;
  }
}

/** The user behind the request's `Authorization: Bearer` header, if any. */
export function authenticate(request: Request): User | null {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  return token ? verifyToken(token) : null;
}

export function unauthorized() {
  return HttpResponse.json({ message: 'Sessão expirada. Entre novamente.' }, { status: 401 });
}

export function forbidden() {
  return HttpResponse.json(
    { message: 'Você não tem permissão para acessar este recurso.' },
    { status: 403 },
  );
}
