export interface Delta {
  /** Short text for the card, e.g. "+12%" or "−3 p.p.". */
  text: string;
  /** A full sentence for screen readers. */
  description: string;
  tone: 'up' | 'down' | 'flat';
}

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** How much `current` moved relative to the same-length period before it. */
export function deltaPercent(current: number, previous: number): Delta | null {
  if (current === 0 && previous === 0) return null;
  if (previous === 0) {
    return {
      text: 'novo',
      description: 'Sem dados no período anterior para comparar.',
      tone: 'up',
    };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) {
    return { text: '0%', description: 'Igual ao período anterior.', tone: 'flat' };
  }
  const sign = change > 0 ? '+' : '−';
  const size = percent.format(Math.abs(change));
  return {
    text: `${sign}${size}%`,
    description: `${change > 0 ? 'Aumento' : 'Queda'} de ${size}% em relação ao período anterior.`,
    tone: change > 0 ? 'up' : 'down',
  };
}

/** For a rate (0 to 1): the difference in percentage points. */
export function deltaPoints(current: number | null, previous: number | null): Delta | null {
  if (current === null || previous === null) return null;
  // Difference of the rates as displayed (rounded), so the numbers on screen always add up.
  const points = Math.round(current * 100) - Math.round(previous * 100);
  if (points === 0)
    return { text: '0 p.p.', description: 'Igual ao período anterior.', tone: 'flat' };
  const sign = points > 0 ? '+' : '−';
  const size = Math.abs(points);
  return {
    text: `${sign}${size} p.p.`,
    description: `${points > 0 ? 'Aumento' : 'Queda'} de ${size} pontos percentuais em relação ao período anterior.`,
    tone: points > 0 ? 'up' : 'down',
  };
}
