import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useLocation, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { Field, Section } from '../../components/DetailSection';
import { Page } from '../../components/Page';
import { contactsQuery } from '../contacts/api';
import { companyDealsQuery } from '../deals/api';
import { formatCurrency } from '../deals/labels';
import { StageChip } from '../deals/StageChip';
import { companyQuery } from './api';
import { sizeLabels } from './labels';

const CONTACTS_SHOWN = 10;

function BackLink() {
  const { state } = useLocation() as { state: { listSearch?: string } | null };
  return (
    <Button
      component={RouterLink}
      to={`/empresas${state?.listSearch ?? ''}`}
      startIcon={<ArrowBackIcon />}
      sx={{ mb: 1, ml: -1 }}
    >
      Voltar para empresas
    </Button>
  );
}

function Contacts({ companyId }: { companyId: string }) {
  const contacts = useQuery(
    contactsQuery({ companyId, page: 1, pageSize: CONTACTS_SHOWN, sort: 'name' }),
  );
  const { data } = contacts;

  return (
    <Section title="Contatos">
      {contacts.isError ? (
        <Alert severity="error">Não foi possível carregar os contatos.</Alert>
      ) : !data ? (
        <Skeleton variant="rounded" height={72} />
      ) : data.total === 0 ? (
        <Typography color="text.secondary">Nenhum contato nesta empresa.</Typography>
      ) : (
        <>
          <List disablePadding>
            {data.data.map((contact) => (
              <ListItem key={contact.id} disableGutters>
                <ListItemText
                  primary={
                    <Link component={RouterLink} to={`/contatos/${contact.id}`}>
                      {contact.name}
                    </Link>
                  }
                  secondary={`${contact.jobTitle} · ${contact.email}`}
                />
              </ListItem>
            ))}
          </List>
          {data.total > data.data.length && (
            <Link component={RouterLink} to={`/contatos?empresa=${companyId}`}>
              Ver todos os {data.total} contatos
            </Link>
          )}
        </>
      )}
    </Section>
  );
}

function Deals({ companyId }: { companyId: string }) {
  const deals = useQuery(companyDealsQuery(companyId));

  return (
    <Section title="Negócios">
      {deals.isError ? (
        <Alert severity="error">Não foi possível carregar os negócios.</Alert>
      ) : !deals.data ? (
        <Skeleton variant="rounded" height={72} />
      ) : deals.data.data.length === 0 ? (
        <Typography color="text.secondary">Nenhum negócio com esta empresa.</Typography>
      ) : (
        <List disablePadding>
          {deals.data.data.map((deal) => (
            <ListItem
              key={deal.id}
              disableGutters
              secondaryAction={<StageChip stage={deal.stage} />}
            >
              <ListItemText
                primary={deal.title}
                secondary={`${deal.contact.name} · ${formatCurrency(deal.value)}`}
                sx={{ pr: 12 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Section>
  );
}

export function CompanyDetailPage() {
  const { id = '' } = useParams();
  const company = useQuery(companyQuery(id));

  if (company.isError) {
    const missing = company.error instanceof ApiError && company.error.status === 404;
    return (
      <Page title={missing ? 'Empresa não encontrada' : 'Empresa'} back={<BackLink />}>
        {missing ? (
          <Typography color="text.secondary">Esta empresa não existe.</Typography>
        ) : (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void company.refetch()}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar a empresa.
          </Alert>
        )}
      </Page>
    );
  }

  if (!company.data) {
    return (
      <Page title="Empresa" back={<BackLink />}>
        <Skeleton
          variant="rounded"
          height={160}
          component="output"
          aria-label="Carregando empresa"
        />
      </Page>
    );
  }

  const { data } = company;
  return (
    <Page title={data.name} back={<BackLink />}>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {data.industry} · {sizeLabels[data.size]} porte
      </Typography>
      <Stack spacing={2}>
        <Section title="Informações">
          <Stack component="dl" spacing={1} sx={{ m: 0 }}>
            <Field label="Setor">{data.industry}</Field>
            <Field label="Porte">{sizeLabels[data.size]}</Field>
            <Field label="Localização">
              {data.city} – {data.state}
            </Field>
            <Field label="Site">
              <Link href={data.website} target="_blank" rel="noopener noreferrer">
                {data.website.replace(/^https?:\/\//, '')}
              </Link>
            </Field>
          </Stack>
        </Section>
        <Section title="Resumo">
          <Stack component="dl" spacing={1} sx={{ m: 0 }}>
            <Field label="Contatos">{data.contactsCount}</Field>
            <Field label="Negócios em aberto">
              {data.openDeals.count === 0
                ? 'Nenhum'
                : `${data.openDeals.count} · ${formatCurrency(data.openDeals.value)}`}
            </Field>
          </Stack>
        </Section>
        <Contacts companyId={data.id} />
        <Deals companyId={data.id} />
      </Stack>
    </Page>
  );
}
