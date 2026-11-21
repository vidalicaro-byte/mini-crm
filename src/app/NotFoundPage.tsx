import Button from '@mui/material/Button';
import { Link } from 'react-router';
import { Page } from '../components/Page';

export function NotFoundPage() {
  return (
    <Page title="Página não encontrada" description="O endereço que você acessou não existe.">
      <Button component={Link} to="/" variant="contained">
        Voltar para a visão geral
      </Button>
    </Page>
  );
}
