import { AppProvider, useApp } from './context/AppContext';
import TopAppBar from './components/TopAppBar';
import SideNavBar from './components/SideNavBar';
import MainContent from './components/MainContent';
import CommandDock from './components/CommandDock';
import LoginPage from './views/LoginPage';

function AppShell() {
  const { isAuthenticated, isRebooting, isSidebarExpanded } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen bg-[var(--color-obsidian-bg)] text-[var(--color-text-primary)] font-sans antialiased overflow-hidden relative">
      {/* Fullscreen Core Reboot Overlay */}
      {isRebooting && (
        <div className="reboot-overlay">
          <div className="scan-line" />
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-color)] border-t-transparent animate-spin" />
          <p className="text-sm font-bold font-mono tracking-[0.2em] text-[var(--accent-fix)] animate-pulse">
            REBOOTING JON COMMAND CORE...
          </p>
          <p className="tech-label text-[0.6rem]">REINITIALIZING NEURAL PATHWAYS & MEMORY REGISTERS</p>
        </div>
      )}

      {/* Left Navigation Rail */}
      <SideNavBar />

      {/* Main Workspace Frame */}
      <div
        className="flex flex-col flex-1 h-full min-h-0 overflow-hidden transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768
            ? (isSidebarExpanded ? '240px' : '72px')
            : '0',
        }}
      >
        {/* Top System Telemetry Bar (Row 1) */}
        <TopAppBar />

        {/* Dynamic Central Subsystem View (Row 2 - Constrained & Internal Scroll) */}
        <MainContent />

        {/* Permanent Reserved Bottom Command Control Dock (Row 3 - Fixed flex-shrink-0) */}
        <CommandDock />
      </div>
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
