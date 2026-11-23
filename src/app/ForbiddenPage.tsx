import Button from '@mui/material/Button';
import { Link } from 'react-router';
import { Page } from '../components/Page';

export function ForbiddenPage() {
  return (
    <Page title="Sem permissão" description="Seu perfil não tem acesso a esta página.">
      <Button component={Link} to="/" variant="contained">
        Voltar para a visão geral
      </Button>
    </Page>
  );
}
