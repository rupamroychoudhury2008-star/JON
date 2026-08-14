import { AppProvider, useApp } from './context/AppContext';
import TopAppBar from './components/TopAppBar';
import SideNavBar from './components/SideNavBar';
import MainContent from './components/MainContent';
import CommandDock from './components/CommandDock';

function AppShell() {
  const { isRebooting } = useApp();

  return (
    <div className="flex h-screen w-screen bg-[var(--color-obsidian-bg)] text-[var(--color-text-primary)] font-sans antialiased overflow-hidden relative">
      {/* Fullscreen Core Reboot Overlay */}
      {isRebooting && (
        <div className="reboot-overlay z-50">
          <div className="scan-line" />
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-cyan-fix)] border-t-transparent animate-spin" />
          <p className="text-sm font-bold font-mono tracking-[0.2em] text-[var(--color-cyan-fix)] animate-pulse">
            REBOOTING JON COMMAND CORE...
          </p>
          <p className="tech-label text-[0.6rem] text-[var(--color-text-muted)]">REINITIALIZING NEURAL PATHWAYS & MEMORY REGISTERS</p>
        </div>
      )}

      {/* Left Navigation Rail (Desktop) / Slide-over Drawer (Mobile) */}
      <SideNavBar />

      {/* Main Workspace Frame */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        {/* Top System Telemetry Bar (Row 1) */}
        <TopAppBar />

        {/* Dynamic Central Subsystem View (Row 2) */}
        <MainContent />

        {/* Permanent Reserved Bottom Command Control Dock (Row 3) */}
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
