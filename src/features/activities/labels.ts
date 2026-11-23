import type { Activity } from '../../api/schemas';

export const activityLabels: Record<Activity['type'], string> = {
  call: 'Ligação',
  email: 'E-mail',
  meeting: 'Reunião',
  note: 'Anotação',
};
