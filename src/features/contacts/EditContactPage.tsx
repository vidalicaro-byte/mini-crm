import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { Page } from '../../components/Page';
import { contactQuery } from './api';
import { ContactForm } from './ContactForm';
import { useUpdateContact } from './mutations';

export function EditContactPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  // Carries the list's filters, so the detail page can still go "back" to the same view.
  const { state } = useLocation() as { state: { listSearch?: string } | null };
  const carried = { listSearch: state?.listSearch };
  const contact = useQuery(contactQuery(id));
  const update = useUpdateContact(id);
  const detailPath = `/contatos/${id}`;

  if (contact.isError) {
    const missing = contact.error instanceof ApiError && contact.error.status === 404;
    return (
      <Page title={missing ? 'Contato não encontrado' : 'Editar contato'}>
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
      <Page title="Editar contato">
        <Skeleton
          variant="rounded"
          height={320}
          component="output"
          aria-label="Carregando contato"
        />
      </Page>
    );
  }

  const { name, email, phone, jobTitle, companyId } = contact.data;
  return (
    <Page title={`Editar ${name}`}>
      <ContactForm
        defaultValues={{ name, email, phone, jobTitle, companyId }}
        submitLabel="Salvar alterações"
        cancelTo={detailPath}
        cancelState={carried}
        onSubmit={async (values) => {
          await update.mutateAsync(values);
          void navigate(detailPath, { state: { ...carried, notice: 'Alterações salvas.' } });
        }}
      />
    </Page>
  );
}
