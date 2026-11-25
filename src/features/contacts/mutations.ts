import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContactInput } from '../../api/schemas';
import { companyKeys } from '../companies/api';
import { overviewKeys } from '../dashboard/api';
import { contactKeys, createContact, updateContact } from './api';

/** Whatever lists or totals show contacts is stale after a change: refetch them. */
function useRefreshContacts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: contactKeys.all }),
      queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
      // A company's contact count is part of its list and detail.
      queryClient.invalidateQueries({ queryKey: companyKeys.all }),
    ]);
}

export function useCreateContact() {
  const refresh = useRefreshContacts();
  return useMutation({
    mutationFn: (input: ContactInput) => createContact(input),
    onSuccess: refresh,
  });
}

export function useUpdateContact(id: string) {
  const refresh = useRefreshContacts();
  return useMutation({
    mutationFn: (input: ContactInput) => updateContact(id, input),
    onSuccess: refresh,
  });
}
