import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useDroppable } from '@dnd-kit/core';
import type { DealResponse, DealStage } from '../../api/schemas';
import { formatCurrency, stageLabels } from '../deals/labels';
import { DealCard } from './DealCard';

interface BoardColumnProps {
  stage: DealStage;
  deals: DealResponse[];
  onMove: (dealId: string, stage: DealStage) => void;
}

export function BoardColumn({ stage, deals, onMove }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const headingId = `coluna-${stage}`;
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Paper
      component="section"
      aria-labelledby={headingId}
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 1.5,
        scrollSnapAlign: 'start',
        bgcolor: isOver ? 'action.hover' : 'background.default',
        outline: isOver ? '2px solid' : 'none',
        outlineColor: 'primary.main',
      }}
    >
      <Typography id={headingId} component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
        {stageLabels[stage]} <span aria-label={`${deals.length} negócios`}>· {deals.length}</span>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {formatCurrency(total)}
      </Typography>
      <Box
        component="ul"
        ref={setNodeRef}
        sx={{
          m: 0,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flex: 1,
          minHeight: 96,
        }}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onMove={(next) => onMove(deal.id, next)} />
        ))}
        {deals.length === 0 && (
          <Typography
            component="li"
            variant="body2"
            color="text.secondary"
            sx={{ listStyle: 'none' }}
          >
            Nenhum negócio
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
