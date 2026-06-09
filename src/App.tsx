import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SessionProvider } from '@/features/auth/SessionProvider';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { queryClient, queryPersister } from '@/lib/queryClient';
import { router } from '@/app/routes';

export default function App() {
  useApplyTheme();

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister }}
      >
        <SessionProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </SessionProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
