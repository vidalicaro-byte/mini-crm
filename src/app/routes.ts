import type { RouteObject } from 'react-router';
import { ContactsPage } from '../features/contacts/ContactsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PipelinePage } from '../features/pipeline/PipelinePage';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'contatos', Component: ContactsPage },
      { path: 'funil', Component: PipelinePage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];
