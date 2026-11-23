import type { KeyboardCoordinateGetter } from '@dnd-kit/core';

/**
 * Keyboard dragging between columns: ←/→ jump the card to the neighbouring column
 * (the default would nudge it by a few pixels). Space/Enter drops, Esc cancels.
 */
export const columnCoordinates: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, collisionRect } },
) => {
  if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;

  const columns = droppableContainers
    .getEnabled()
    .map((container) => droppableRects.get(container.id))
    .filter((rect) => rect !== undefined)
    .sort((a, b) => a.left - b.left);

  const centerX = collisionRect.left + collisionRect.width / 2;
  const current = columns.findIndex((rect) => centerX >= rect.left && centerX <= rect.right);
  const target = columns[current + (event.code === 'ArrowRight' ? 1 : -1)];
  if (!target) return undefined;

  return {
    x: target.left + (target.width - collisionRect.width) / 2,
    y: target.top + 8,
  };
};
