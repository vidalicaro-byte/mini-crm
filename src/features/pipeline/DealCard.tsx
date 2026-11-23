import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDraggable } from '@dnd-kit/core';
import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import type { DealResponse, DealStage } from '../../api/schemas';
import { formatCurrency, stageLabels, stageOrder } from '../deals/labels';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

interface DealCardViewProps {
  deal: DealResponse;
  /** Set on the card being dragged (the floating copy) and on the one it left behind. */
  state?: 'overlay' | 'placeholder';
  onMove?: (stage: DealStage) => void;
  /** The focusable drag handle (keyboard and screen-reader entry point). */
  handle?: ReactNode;
  /** Pointer/touch listeners: dragging works from anywhere on the card. */
  dragListeners?: DraggableSyntheticListeners;
}

/** The card as drawn; `DealCard` below makes it draggable. */
export function DealCardView({ deal, state, onMove, handle, dragListeners }: DealCardViewProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <Paper
      variant="outlined"
      {...dragListeners}
      sx={{
        p: 1.5,
        opacity: state === 'placeholder' ? 0.35 : 1,
        boxShadow: state === 'overlay' ? 6 : 0,
        cursor: state === 'overlay' ? 'grabbing' : 'grab',
        touchAction: 'manipulation',
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
        {handle ?? (
          <DragIndicatorIcon fontSize="small" color="disabled" sx={{ m: 0.5 }} aria-hidden />
        )}
        <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.25}>
          <Typography component="h3" variant="subtitle2" sx={{ lineHeight: 1.3 }}>
            {deal.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {deal.company.name}
          </Typography>
          <Link
            component={RouterLink}
            to={`/contatos/${deal.contact.id}`}
            variant="body2"
            noWrap
            // Pressing the link must not start a drag.
            onPointerDown={(event) => event.stopPropagation()}
          >
            {deal.contact.name}
          </Link>
          <Typography variant="body2" sx={{ fontWeight: 600, pt: 0.5 }}>
            {formatCurrency(deal.value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Previsão {dateFormat.format(new Date(deal.expectedCloseDate))}
          </Typography>
        </Stack>
        {onMove && (
          <>
            <IconButton
              size="small"
              aria-label={`Mover ${deal.title}`}
              aria-haspopup="menu"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              edge="end"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              slotProps={{ list: { 'aria-label': `Mover ${deal.title} para` } }}
            >
              {stageOrder.map((stage) => (
                <MenuItem
                  key={stage}
                  selected={stage === deal.stage}
                  disabled={stage === deal.stage}
                  onClick={() => {
                    setMenuAnchor(null);
                    onMove(stage);
                  }}
                >
                  {stageLabels[stage]}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Stack>
    </Paper>
  );
}

export function DealCard({
  deal,
  onMove,
}: {
  deal: DealResponse;
  onMove: (stage: DealStage) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <li ref={setNodeRef} style={{ listStyle: 'none' }}>
      <DealCardView
        deal={deal}
        state={isDragging ? 'placeholder' : undefined}
        onMove={onMove}
        dragListeners={listeners}
        // Only the handle is a control: a card that is itself a "button" would nest the link
        // and the menu button inside another button.
        handle={
          <IconButton
            ref={setActivatorNodeRef}
            size="small"
            aria-label={`Arrastar ${deal.title}`}
            sx={{ cursor: 'grab' }}
            {...attributes}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        }
      />
    </li>
  );
}
