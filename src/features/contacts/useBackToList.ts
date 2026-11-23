import { useLocation } from 'react-router';

/** The list's filters travel with the link, so "Voltar" returns to the same view. */
export function useBackToList() {
  const { state } = useLocation() as { state: { listSearch?: string } | null };
  return `/contatos${state?.listSearch ?? ''}`;
}
