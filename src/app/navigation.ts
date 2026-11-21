import ContactsIcon from '@mui/icons-material/Contacts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  label: string;
  to: string;
  icon: SvgIconComponent;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { label: 'Visão geral', to: '/', icon: DashboardIcon, end: true },
  { label: 'Contatos', to: '/contatos', icon: ContactsIcon },
  { label: 'Funil', to: '/funil', icon: ViewKanbanIcon },
];
