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
import EditIcon from '@mui/icons-material/Edit';
import { Link as RouterLink, useLocation, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { Field, Section } from '../../components/DetailSection';
import { Page } from '../../components/Page';
import { contactActivitiesQuery } from '../activities/api';
import { activityLabels } from '../activities/labels';
import { contactDealsQuery } from '../deals/api';
import { formatCurrency } from '../deals/labels';
import { StageChip } from '../deals/StageChip';
import { contactQuery } from './api';
import { useBackToList } from './useBackToList';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });
const formatDate = (iso: string) => dateFormat.format(new Date(iso));

function BackLink() {
  return (
    <Button
      component={RouterLink}
      to={useBackToList()}
      startIcon={<ArrowBackIcon />}
      sx={{ mb: 1, ml: -1 }}
    >
      Voltar para contatos
    </Button>
  );
}

function Deals({ contactId }: { contactId: string }) {
  const deals = useQuery(contactDealsQuery(contactId));

  return (
    <Section title="Negócios">
      {deals.isError ? (
        <Alert severity="error">Não foi possível carregar os negócios.</Alert>
      ) : !deals.data ? (
        <Skeleton variant="rounded" height={72} />
      ) : deals.data.data.length === 0 ? (
        <Typography color="text.secondary">Nenhum negócio com este contato.</Typography>
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
                secondary={`${formatCurrency(deal.value)} · previsão ${formatDate(deal.expectedCloseDate)}`}
                sx={{ pr: 12 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Section>
  );
}

function Activities({ contactId }: { contactId: string }) {
  const activities = useQuery(contactActivitiesQuery(contactId));

  return (
    <Section title="Histórico de atividades">
      {activities.isError ? (
        <Alert severity="error">Não foi possível carregar o histórico.</Alert>
      ) : !activities.data ? (
        <Skeleton variant="rounded" height={120} />
      ) : activities.data.data.length === 0 ? (
        <Typography color="text.secondary">Nenhuma atividade registrada.</Typography>
      ) : (
        <List disablePadding>
          {activities.data.data.map((activity) => (
            <ListItem key={activity.id} disableGutters alignItems="flex-start">
              <ListItemText
                primary={
                  <>
                    <strong>{activityLabels[activity.type]}</strong>
                    {' · '}
                    <time dateTime={activity.date}>{formatDate(activity.date)}</time>
                  </>
                }
                secondary={activity.summary}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Section>
  );
}

export function ContactDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const contact = useQuery(contactQuery(id));

  if (contact.isError) {
    const missing = contact.error instanceof ApiError && contact.error.status === 404;
    return (
      <Page title={missing ? 'Contato não encontrado' : 'Contato'} back={<BackLink />}>
        {missing ? (
          <Typography color="text.secondary">
            Este contato não existe ou você não tem acesso a ele.
          </Typography>
        ) : (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void contact.refetch()}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar o contato.
          </Alert>
        )}
      </Page>
    );
  }

  if (!contact.data) {
    return (
      <Page title="Contato" back={<BackLink />}>
        <Skeleton
          variant="rounded"
          height={160}
          component="output"
          aria-label="Carregando contato"
        />
      </Page>
    );
  }

  const { data } = contact;
  const notice = (location.state as { notice?: string } | null)?.notice;
  return (
    <Page
      title={data.name}
      back={<BackLink />}
      actions={
        <Button
          component={RouterLink}
          to={`/contatos/${data.id}/editar`}
          state={location.state}
          variant="outlined"
          startIcon={<EditIcon />}
        >
          Editar
        </Button>
      }
    >
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {data.jobTitle} · {data.company.name}
      </Typography>
      <Stack spacing={2}>
        <Section title="Informações">
          <Stack component="dl" spacing={1} sx={{ m: 0 }}>
            <Field label="E-mail">
              <Link href={`mailto:${data.email}`}>{data.email}</Link>
            </Field>
            <Field label="Telefone">
              <Link href={`tel:${data.phone.replace(/\D/g, '')}`}>{data.phone}</Link>
            </Field>
            <Field label="Empresa">
              <Link component={RouterLink} to={`/empresas/${data.company.id}`}>
                {data.company.name}
              </Link>
            </Field>
            <Field label="Contato desde">{formatDate(data.createdAt)}</Field>
          </Stack>
        </Section>
        <Deals contactId={data.id} />
        <Activities contactId={data.id} />
      </Stack>
    </Page>
  );
}
