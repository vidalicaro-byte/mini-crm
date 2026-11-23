import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useQuery } from '@tanstack/react-query';
import { Page } from '../../components/Page';
import { roleLabels } from '../auth/roles';
import { teamQuery } from './api';

export function TeamPage() {
  const team = useQuery(teamQuery());

  return (
    <Page
      title="Equipe"
      description="Pessoas com acesso ao Mini-CRM. Visível apenas para administradores."
    >
      {team.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void team.refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar a equipe.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="Equipe">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Perfil</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {team.data
                ? team.data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={roleLabels[user.role]}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          variant={user.role === 'admin' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                : Array.from({ length: 4 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={3}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Page>
  );
}
