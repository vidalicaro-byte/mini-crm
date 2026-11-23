import type { RouteObject } from 'react-router';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { LoginPage } from '../features/auth/LoginPage';
import { RequireAuth, RequireRole } from '../features/auth/RequireAuth';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';

// Each page is its own chunk, downloaded when the user first visits it.
export const routes: RouteObject[] = [
  { path: '/login', Component: LoginPage },
  {
    // Everything below requires a signed-in user.
    Component: RequireAuth,
    // Shown while the first page's code downloads (all pages below load on demand).
    HydrateFallback: () => <FullPageSpinner label="Carregando…" />,
    children: [
      {
        path: '/',
        Component: AppLayout,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('../features/dashboard/DashboardPage')).DashboardPage,
            }),
          },
          {
            path: 'contatos',
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('../features/contacts/ContactsPage')).ContactsPage,
                }),
              },
              {
                path: 'novo',
                lazy: async () => ({
                  Component: (await import('../features/contacts/NewContactPage')).NewContactPage,
                }),
              },
              {
                path: ':id/editar',
                lazy: async () => ({
                  Component: (await import('../features/contacts/EditContactPage')).EditContactPage,
                }),
              },
              {
                path: ':id',
                lazy: async () => ({
                  Component: (await import('../features/contacts/ContactDetailPage'))
                    .ContactDetailPage,
                }),
              },
            ],
          },
          {
            path: 'funil',
            lazy: async () => ({
              Component: (await import('../features/pipeline/PipelinePage')).PipelinePage,
            }),
          },
          {
            path: 'equipe',
            element: <RequireRole roles={['admin']} />,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('../features/team/TeamPage')).TeamPage,
                }),
              },
            ],
          },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
