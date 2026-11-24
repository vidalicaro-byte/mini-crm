import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { periodSchema, type Period } from '../../api/schemas';

export const DEFAULT_PERIOD: Period = '30d';

export const periodLabels: Record<Period, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  '12m': '12 meses',
};

/** The chosen period lives in the URL (?periodo=90d), so a link shares the exact view. */
export function usePeriod() {
  const [params, setParams] = useSearchParams();
  const parsed = periodSchema.safeParse(params.get('periodo'));
  const period = parsed.success ? parsed.data : DEFAULT_PERIOD;

  const setPeriod = useCallback(
    (next: Period) =>
      setParams(
        (previous) => {
          const copy = new URLSearchParams(previous);
          if (next === DEFAULT_PERIOD) copy.delete('periodo');
          else copy.set('periodo', next);
          return copy;
        },
        { replace: true },
      ),
    [setParams],
  );

  return { period, setPeriod };
}
