import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { FullScreenMessage } from '@/components/FullScreenMessage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { t } from '@/lib/i18n';

const NotesHomePage = lazy(() => import('@/features/notes/NotesHomePage'));
const TasksPage = lazy(() => import('@/features/tasks/TasksPage'));

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<FullScreenMessage>{t('app.loading')}</FullScreenMessage>}>{element}</Suspense>;
}

export const router = createHashRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
      { index: true, element: lazyRoute(<NotesHomePage />) },
      { path: 'tasks', element: lazyRoute(<TasksPage />) },
    ],
    },
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);
