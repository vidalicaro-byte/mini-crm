import { describe, expect, it, vi } from 'vitest';
import { tokenStore } from './tokenStore';

describe('tokenStore', () => {
  it('keeps the token in memory and in localStorage', () => {
    tokenStore.set('abc');
    expect(tokenStore.get()).toBe('abc');
    expect(localStorage.getItem('mini-crm.token')).toBe('abc');

    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
    expect(localStorage.getItem('mini-crm.token')).toBeNull();
  });

  it('notifies subscribers when the token changes, until they unsubscribe', () => {
    const listener = vi.fn<() => void>();
    const unsubscribe = tokenStore.subscribe(listener);

    tokenStore.set('abc');
    tokenStore.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    tokenStore.set('def');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
