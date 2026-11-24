import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import Box from '@mui/material/Box';
import { useMemo, useState } from 'react';
import type { DealResponse, DealStage } from '../../api/schemas';
import { stageLabels, stageOrder } from '../deals/labels';
import { BoardColumn } from './BoardColumn';
import { DealCardView } from './DealCard';
import { columnCoordinates } from './keyboard';

const isStage = (value: unknown): value is DealStage =>
  typeof value === 'string' && (stageOrder as string[]).includes(value);

// The pointer decides when there is one; with the keyboard the card's own box decides.
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

// Sensor options live outside the component: new objects on every render would rebuild the
// sensors, and with them every card's drag listeners, on each render.
// Mouse and touch get their own sensors (a pointer sensor would also grab touches and fight with
// scrolling). A few pixels of movement before a mouse drag starts, so plain clicks still click.
const mouseOptions = { activationConstraint: { distance: 6 } };
// On touch screens a short press starts the drag; a swipe still scrolls the board.
const touchOptions = { activationConstraint: { delay: 200, tolerance: 8 } };
const keyboardOptions = { coordinateGetter: columnCoordinates };

interface BoardProps {
  deals: DealResponse[];
  onMove: (dealId: string, stage: DealStage) => void;
}

export function Board({ deals, onMove }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeDeal = deals.find((deal) => deal.id === activeId);

  const sensors = useSensors(
    useSensor(MouseSensor, mouseOptions),
    useSensor(TouchSensor, touchOptions),
    useSensor(KeyboardSensor, keyboardOptions),
  );

  // The same array objects between renders, so unchanged columns are not rendered again.
  const dealsByStage = useMemo(() => {
    const grouped = Object.fromEntries(stageOrder.map((stage) => [stage, [] as DealResponse[]]));
    for (const deal of deals) grouped[deal.stage]?.push(deal);
    return grouped;
  }, [deals]);

  const titleOf = (id: string | number) => deals.find((deal) => deal.id === id)?.title ?? 'Negócio';
  const stageOf = (id: string | number | undefined) => (isStage(id) ? stageLabels[id] : undefined);

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Pegou ${titleOf(active.id)}. Use as setas para a esquerda e a direita para escolher a etapa.`,
    onDragOver: ({ active, over }) => {
      const stage = stageOf(over?.id);
      return stage ? `${titleOf(active.id)} está sobre a etapa ${stage}.` : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const stage = stageOf(over?.id);
      return stage
        ? `${titleOf(active.id)} solto na etapa ${stage}.`
        : `${titleOf(active.id)} solto fora das etapas. Nada mudou.`;
    },
    onDragCancel: ({ active }) => `Movimento cancelado. ${titleOf(active.id)} ficou onde estava.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const deal = deals.find((item) => item.id === active.id);
    if (deal && isStage(over?.id) && over.id !== deal.stage) onMove(deal.id, over.id);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Para mover um negócio, pressione espaço ou Enter, use as setas para a esquerda e a direita para escolher a etapa e pressione espaço ou Enter para soltar. Esc cancela. Também é possível usar o botão Mover do cartão.',
        },
        restoreFocus: true,
      }}
      onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <Box
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: { xs: '82%', sm: 'minmax(260px, 1fr)' },
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          pb: 2,
          alignItems: 'stretch',
        }}
      >
        {stageOrder.map((stage) => (
          <BoardColumn
            key={stage}
            stage={stage}
            deals={dealsByStage[stage] ?? []}
            onMove={onMove}
          />
        ))}
      </Box>
      <DragOverlay>{activeDeal && <DealCardView deal={activeDeal} state="overlay" />}</DragOverlay>
    </DndContext>
  );
}
