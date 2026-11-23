import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Page } from '../../components/Page';
import { contactsQuery } from './api';
import { ContactsTable } from './ContactsTable';
import { ContactsToolbar } from './ContactsToolbar';
import { hasActiveFilters } from './filters';
import { useContactsFilters } from './useContactsFilters';

export function ContactsPage() {
  const { filters, update, clear } = useContactsFilters();
  const { page, pageSize, sort, order, q, companyId } = filters;
  const contacts = useQuery(contactsQuery({ page, pageSize, sort, order, q, companyId }));
  const { data } = contacts;

  // A link to a page that no longer exists (fewer results than before) lands on the last one.
  useEffect(() => {
    if (!data) return;
    const lastPage = Math.max(1, Math.ceil(data.total / pageSize));
    if (page > lastPage) update({ page: lastPage }, { replace: true });
  }, [data, page, pageSize, update]);

  let content;
  if (contacts.isError && !data) {
    content = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void contacts.refetch()}>
            Tentar novamente
          </Button>
        }
      >
        Não foi possível carregar os contatos.
      </Alert>
    );
  } else if (!data) {
    content = <Skeleton variant="rounded" height={420} aria-label="Carregando contatos" />;
  } else if (data.total === 0) {
    content = (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
          {hasActiveFilters(filters) ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {hasActiveFilters(filters)
            ? 'Tente outra busca ou remova os filtros.'
            : 'Os contatos cadastrados aparecerão aqui.'}
        </Typography>
        {hasActiveFilters(filters) && <Button onClick={clear}>Limpar filtros</Button>}
      </Paper>
    );
  } else {
    content = (
      <ContactsTable
        rows={data.data}
        total={data.total}
        filters={filters}
        loading={contacts.isFetching}
        onChange={update}
      />
    );
  }

  return (
    <Page title="Contatos">
      <ContactsToolbar filters={filters} onChange={update} onClear={clear} />
      <Stack spacing={1}>
        <Typography component="output" color="text.secondary" variant="body2">
          {data
            ? `${data.total.toLocaleString('pt-BR')} ${data.total === 1 ? 'contato' : 'contatos'}`
            : ' '}
        </Typography>
        {contacts.isError && data && (
          <Alert severity="warning">Não foi possível atualizar a lista.</Alert>
        )}
        {content}
      </Stack>
    </Page>
  );
}
