import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { companiesQuery } from '../companies/api';
import { contactsQuery } from '../contacts/api';

function CountCard({ label, total }: { label: string; total: number | undefined }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" gutterBottom>
          {label}
        </Typography>
        {/* The skeleton lives inside the same Typography so it has the same height as the number. */}
        <Typography variant="h3" component="p" sx={{ fontWeight: 700 }}>
          {total === undefined ? <Skeleton width={80} /> : total.toLocaleString('pt-BR')}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function OverviewCounts() {
  // pageSize 1: only the total is needed, not the records.
  const contacts = useQuery(contactsQuery({ page: 1, pageSize: 1 }));
  const companies = useQuery(companiesQuery({ page: 1, pageSize: 1 }));

  const failed = contacts.isError || companies.isError;
  if (failed) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              if (contacts.isError) void contacts.refetch();
              if (companies.isError) void companies.refetch();
            }}
          >
            Tentar novamente
          </Button>
        }
      >
        Não foi possível carregar os totais.
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CountCard label="Contatos" total={contacts.data?.total} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <CountCard label="Empresas" total={companies.data?.total} />
      </Grid>
    </Grid>
  );
}
