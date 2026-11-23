import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ContactInput } from '../../api/schemas';
import { contactKeys, createContact, updateContact } from './api';

/** Whatever lists or totals show contacts is stale after a change: refetch them. */
function useRefreshContacts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: contactKeys.all });
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
