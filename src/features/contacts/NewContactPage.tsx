import { useNavigate } from 'react-router';
import { Page } from '../../components/Page';
import { ContactForm } from './ContactForm';
import { emptyContact } from './emptyContact';
import { useCreateContact } from './mutations';
import { useBackToList } from './useBackToList';

export function NewContactPage() {
  const navigate = useNavigate();
  const backToList = useBackToList();
  const create = useCreateContact();

  return (
    <Page title="Novo contato">
      <ContactForm
        defaultValues={emptyContact}
        submitLabel="Criar contato"
        cancelTo={backToList}
        onSubmit={async (values) => {
          const contact = await create.mutateAsync(values);
          void navigate(`/contatos/${contact.id}`, {
            state: { listSearch: backToList.slice('/contatos'.length), notice: 'Contato criado.' },
          });
        }}
      />
    </Page>
  );
}
