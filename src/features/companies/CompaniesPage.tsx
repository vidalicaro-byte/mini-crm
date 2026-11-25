import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Page } from '../../components/Page';
import { companiesQuery } from './api';
import { CompaniesTable } from './CompaniesTable';
import { CompaniesToolbar } from './CompaniesToolbar';
import { hasActiveFilters } from './filters';
import { useCompaniesFilters } from './useCompaniesFilters';

export function CompaniesPage() {
  const { filters, update, clear } = useCompaniesFilters();
  const { page, pageSize, sort, order, q, size } = filters;
  const companies = useQuery(
    companiesQuery({ page, pageSize, sort, order, q, size: size || undefined }),
  );
  const { data } = companies;

  // A link to a page that no longer exists (fewer results than before) lands on the last one.
  useEffect(() => {
    if (!data) return;
    const lastPage = Math.max(1, Math.ceil(data.total / pageSize));
    if (page > lastPage) update({ page: lastPage }, { replace: true });
  }, [data, page, pageSize, update]);

  let content;
  if (companies.isError && !data) {
    content = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void companies.refetch()}>
            Tentar novamente
          </Button>
        }
      >
        Não foi possível carregar as empresas.
      </Alert>
    );
  } else if (!data) {
    content = (
      <Skeleton
        variant="rounded"
        height={420}
        component="output"
        aria-label="Carregando empresas"
      />
    );
  } else if (data.total === 0) {
    content = (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
          {hasActiveFilters(filters) ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa ainda'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {hasActiveFilters(filters)
            ? 'Tente outra busca ou remova os filtros.'
            : 'As empresas cadastradas aparecerão aqui.'}
        </Typography>
        {hasActiveFilters(filters) && <Button onClick={clear}>Limpar filtros</Button>}
      </Paper>
    );
  } else {
    content = (
      <CompaniesTable
        rows={data.data}
        total={data.total}
        filters={filters}
        loading={companies.isFetching}
        onChange={update}
      />
    );
  }

  return (
    <Page title="Empresas">
      <CompaniesToolbar filters={filters} onChange={update} onClear={clear} />
      <Stack spacing={1}>
        <Typography component="output" color="text.secondary" variant="body2">
          {data
            ? `${data.total.toLocaleString('pt-BR')} ${data.total === 1 ? 'empresa' : 'empresas'}`
            : ' '}
        </Typography>
        {companies.isError && data && (
          <Alert severity="warning">Não foi possível atualizar a lista.</Alert>
        )}
        {content}
      </Stack>
    </Page>
  );
}
