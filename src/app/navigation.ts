import ContactsIcon from '@mui/icons-material/Contacts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import type { SvgIconComponent } from '@mui/icons-material';
import type { UserRole } from '../api/schemas';

export interface NavItem {
  label: string;
  to: string;
  icon: SvgIconComponent;
  end?: boolean;
  /** When set, only these roles see the item. */
  roles?: UserRole[];
}

export const navItems: NavItem[] = [
  { label: 'Visão geral', to: '/', icon: DashboardIcon, end: true },
  { label: 'Contatos', to: '/contatos', icon: ContactsIcon },
  { label: 'Funil', to: '/funil', icon: ViewKanbanIcon },
  { label: 'Equipe', to: '/equipe', icon: GroupsIcon, roles: ['admin'] },
];
