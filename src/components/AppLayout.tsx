import { NavLink, Outlet } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { useSession } from '@/features/auth/sessionContext';
import { t, type MessageKey } from '@/lib/i18n';
import { ThemeToggle } from './ThemeToggle';
import { SyncStatusBadge } from './SyncStatusBadge';

interface NavItem {
  to: string;
  labelKey: MessageKey;
  end: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.notes', end: true },
  { to: '/tasks', labelKey: 'nav.tasks', end: false },
];

export function AppLayout() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { signOut } = useSession();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
        }}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('nav.toggleSidebar')}
          aria-expanded={sidebarOpen}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            padding: '0.35rem 0.6rem',
            cursor: 'pointer',
            color: 'var(--color-text)',
          }}
        >
          ☰
        </button>
        <strong style={{ marginRight: 'auto' }}>{t('app.title')}</strong>
        <SyncStatusBadge />
        <ThemeToggle />
        <button
          type="button"
          onClick={() => void signOut()}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            padding: '0.35rem 0.7rem',
            cursor: 'pointer',
            color: 'var(--color-text)',
          }}
        >
          {t('auth.signOut')}
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {sidebarOpen && (
          <nav
            aria-label={t('nav.notes')}
            style={{
              width: '14rem',
              borderRight: '1px solid var(--color-border)',
              padding: '1rem',
              background: 'var(--color-bg-elevated)',
            }}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    style={({ isActive }) => ({
                      display: 'block',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '0.4rem',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-primary-contrast)' : 'var(--color-text)',
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                    })}
                  >
                    {t(item.labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <main style={{ flex: 1, minWidth: 0, padding: '1.5rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
