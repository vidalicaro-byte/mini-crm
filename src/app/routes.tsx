import type { RouteObject } from 'react-router';
import { LoginPage } from '../features/auth/LoginPage';
import { RequireAuth, RequireRole } from '../features/auth/RequireAuth';
import { ContactsPage } from '../features/contacts/ContactsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PipelinePage } from '../features/pipeline/PipelinePage';
import { TeamPage } from '../features/team/TeamPage';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';

export const routes: RouteObject[] = [
  { path: '/login', Component: LoginPage },
  {
    // Everything below requires a signed-in user.
    Component: RequireAuth,
    children: [
      {
        path: '/',
        Component: AppLayout,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'contatos', Component: ContactsPage },
          { path: 'funil', Component: PipelinePage },
          {
            path: 'equipe',
            element: <RequireRole roles={['admin']} />,
            children: [{ index: true, Component: TeamPage }],
          },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
