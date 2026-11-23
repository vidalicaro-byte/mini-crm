import type { UserRole } from '../../api/schemas';

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
};
