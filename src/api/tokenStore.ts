const STORAGE_KEY = 'mini-crm.token';

/**
 * Holds the session token. It is kept in memory and mirrored to localStorage so a reload
 * keeps the session. localStorage is readable by any script on the page (XSS), which is why
 * a real backend would rather set an httpOnly cookie; for this demo the trade-off is fine.
 *
 * The store is observable (`subscribe`/`get`) so React can follow it with useSyncExternalStore.
 */
let token: string | null | undefined; // undefined: not read from storage yet
const listeners = new Set<() => void>();

function readStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export const tokenStore = {
  get(): string | null {
    if (token === undefined) token = readStorage();
    return token;
  },

  set(value: string) {
    token = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage unavailable (private mode, quota): the session just won't survive a reload.
    }
    emit();
  },

  clear() {
    token = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // See above.
    }
    emit();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
