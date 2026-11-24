import { describe, expect, it } from 'vitest';
import { deltaPercent, deltaPoints } from './delta';

describe('deltaPercent', () => {
  it('shows growth and decline with a sign and a spoken sentence', () => {
    expect(deltaPercent(150, 100)).toMatchObject({ text: '+50%', tone: 'up' });
    expect(deltaPercent(150, 100)?.description).toBe(
      'Aumento de 50% em relação ao período anterior.',
    );
    expect(deltaPercent(60, 100)).toMatchObject({ text: '−40%', tone: 'down' });
    expect(deltaPercent(60, 100)?.description).toBe('Queda de 40% em relação ao período anterior.');
  });

  it('reports "no change" when the rounded change is zero', () => {
    expect(deltaPercent(100, 100)).toMatchObject({ text: '0%', tone: 'flat' });
    expect(deltaPercent(1001, 1000)).toMatchObject({ text: '0%', tone: 'flat' });
  });

  it('does not divide by zero: no base means "novo", nothing at all means no delta', () => {
    expect(deltaPercent(5, 0)).toMatchObject({ text: 'novo', tone: 'up' });
    expect(deltaPercent(0, 0)).toBeNull();
  });

  it('shows a full drop to zero as −100%', () => {
    expect(deltaPercent(0, 8)).toMatchObject({ text: '−100%', tone: 'down' });
  });
});

describe('deltaPoints', () => {
  it('is the difference in percentage points', () => {
    expect(deltaPoints(0.75, 0.5)).toMatchObject({ text: '+25 p.p.', tone: 'up' });
    expect(deltaPoints(0.5, 0.875)).toMatchObject({ text: '−38 p.p.', tone: 'down' });
    expect(deltaPoints(0.5, 0.5)).toMatchObject({ text: '0 p.p.', tone: 'flat' });
  });

  it('has nothing to compare when either period closed no deals', () => {
    expect(deltaPoints(null, 0.5)).toBeNull();
    expect(deltaPoints(0.5, null)).toBeNull();
  });
});
