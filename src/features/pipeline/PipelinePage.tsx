import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { DealStage } from '../../api/schemas';
import { Page } from '../../components/Page';
import { dealsBoardQuery } from '../deals/api';
import { formatCurrency, stageLabels } from '../deals/labels';
import { Board } from './Board';
import { useMoveDeal } from './useMoveDeal';

export function PipelinePage() {
  const deals = useQuery(dealsBoardQuery());
  const move = useMoveDeal();
  const [problem, setProblem] = useState<string | null>(null);

  const board = deals.data?.data;
  const openValue = board
    ?.filter((deal) => deal.stage !== 'ganho' && deal.stage !== 'perdido')
    .reduce((sum, deal) => sum + deal.value, 0);

  function handleMove(dealId: string, stage: DealStage) {
    const deal = board?.find((item) => item.id === dealId);
    if (!deal) return;
    setProblem(null);
    move.mutate(
      { id: dealId, stage },
      {
        onError: () =>
          setProblem(
            `Não foi possível mover “${deal.title}” para ${stageLabels[stage]}. O negócio voltou para ${stageLabels[deal.stage]}.`,
          ),
      },
    );
  }

  return (
    <Page title="Funil">
      {board && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {board.length} negócios · {formatCurrency(openValue ?? 0)} em aberto
        </Typography>
      )}
      {problem && (
        <Alert severity="error" onClose={() => setProblem(null)} sx={{ mb: 2 }}>
          {problem}
        </Alert>
      )}
      {deals.isError && !board ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void deals.refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar o funil.
        </Alert>
      ) : !board ? (
        <Stack direction="row" spacing={2} aria-label="Carregando funil">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} variant="rounded" height={360} sx={{ flex: 1 }} />
          ))}
        </Stack>
      ) : (
        <Board deals={board} onMove={handleMove} />
      )}
    </Page>
  );
}
