import Chip from '@mui/material/Chip';
import type { DealStage } from '../../api/schemas';
import { stageColors, stageLabels } from './labels';

// MUI's own light-theme colors for warning and info are too pale for small text on white
// (about 3.8:1; WCAG asks for 4.5:1). These darker shades keep each stage's hue and reach 5.6:1 or more.
const lightTextColors = {
  default: undefined,
  info: '#01579b',
  warning: '#9c3d00',
  success: '#1b5e20',
  error: '#c62828',
} as const;

/** A deal's stage as a small colored label that stays readable in both themes. */
export function StageChip({ stage }: { stage: DealStage }) {
  const color = stageColors[stage];
  return (
    <Chip
      size="small"
      label={stageLabels[stage]}
      color={color}
      variant="outlined"
      sx={(theme) => theme.applyStyles('light', { color: lightTextColors[color] })}
    />
  );
}
