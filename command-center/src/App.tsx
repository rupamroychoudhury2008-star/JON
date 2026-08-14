import { AppProvider, useApp } from './context/AppContext';
import TopAppBar from './components/TopAppBar';
import SideNavBar from './components/SideNavBar';
import MainContent from './components/MainContent';
import CommandDock from './components/CommandDock';

function AppShell() {
  const { isRebooting } = useApp();

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--color-obsidian-bg)] text-[var(--color-text-primary)] font-sans antialiased overflow-hidden relative">
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

      {/* Row 1: Top System Telemetry Bar across full width */}
      <TopAppBar />

      {/* Row 2: Workspace Body Container (Sidebar + Main Content side by side) */}
      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        {/* Left Navigation Rail (Desktop) / Slide-over Drawer (Mobile) */}
        <SideNavBar />

        {/* Main Workspace Frame */}
        <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
          {/* Dynamic Central Subsystem View */}
          <MainContent />

          {/* Permanent Reserved Bottom Command Control Dock */}
          <CommandDock />
        </div>
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
