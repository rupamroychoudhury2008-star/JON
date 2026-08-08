import { useEffect } from 'react';
import { AppProvider, useApp, THEME_COLORS } from './context/AppContext';
import TopAppBar from './components/TopAppBar';
import SideNavBar from './components/SideNavBar';
import MainContent from './components/MainContent';
import MobileBottomDrawer from './components/MobileBottomDrawer';

function AppShell() {
  const { isRebooting, isSidebarExpanded } = useApp();

  useEffect(() => {
    const colors = THEME_COLORS.cyan;
    document.documentElement.style.setProperty('--accent-color', colors.primary);
    document.documentElement.style.setProperty('--accent-fix', colors.fix);
    document.documentElement.style.setProperty('--accent-glow', colors.glow);
    document.documentElement.style.setProperty('--accent-subtle', colors.subtle);
  }, []);

  return (
    <div className="app-frame relative flex flex-col overflow-hidden">
      {/* Global Reboot Overlay */}
      {isRebooting && (
        <div className="reboot-overlay">
          <div className="scan-line" />
          <div className="relative flex items-center justify-center w-24 h-24">
            <div
              className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
              style={{
                borderColor: 'var(--accent-color, var(--color-cyan-dim))',
                borderTopColor: 'transparent',
                boxShadow: '0 0 20px var(--accent-glow, rgba(0,219,231,0.5))',
              }}
            />
            <span
              className="material-symbols-outlined text-3xl animate-pulse"
              style={{ color: 'var(--accent-fix, var(--color-cyan-fix))' }}
            >
              restart_alt
            </span>
          </div>

          <p
            className="text-base font-bold tracking-[0.22em] type-cursor uppercase text-center px-4"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-fix, var(--color-cyan-fix))',
              textShadow: '0 0 16px var(--accent-glow, rgba(0,219,231,0.5))',
            }}
          >
            REBOOTING JON COMMAND CORE
          </p>
          <p className="tech-label" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
            FLUSHING MEMORY REGISTERS • REINITIALIZING SUBSYSTEMS
          </p>
        </div>
      )}

      {/* Full-Height Left Sidebar (top-0 to bottom-0 fixed) */}
      <SideNavBar />

      {/* Main Right Area: Dynamic left margin shifts & resizes page smoothly without overlap */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 pb-[var(--mobile-drawer-height)] md:pb-0"
        style={{
          marginLeft: isSidebarExpanded ? '240px' : '72px',
        }}
      >
        <TopAppBar />
        <div className="flex-1 overflow-hidden">
          <MainContent />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileBottomDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
