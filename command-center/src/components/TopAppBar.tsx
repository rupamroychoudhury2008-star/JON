import { useApp, type ViewId } from '../context/AppContext';
import { useDeviceStatus } from '../hooks/useDeviceStatus';

const TOP_TABS: { id: ViewId; label: string }[] = [
  { id: 'voice', label: 'JON CORE' },
  { id: 'session', label: 'SESSION' },
  { id: 'tools', label: 'TOOLS' },
  { id: 'memory', label: 'MEMORY' },
  { id: 'metrics', label: 'METRICS' },
  { id: 'logs', label: 'LOGS' },
];

export default function TopAppBar() {
  const { activeView, setActiveView, colorMode, toggleColorMode, user, logout } = useApp();
  const {
    batteryIcon,
    batteryColor,
    wifiIcon,
    wifiColor,
    signalIcon,
    signalColor,
  } = useDeviceStatus();

  return (
    <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-[rgba(0,219,231,0.2)] bg-[var(--color-obsidian-bg)] flex-shrink-0 z-20">
      {/* Far Left: Hexagonal Cyan Emblem + Circular J Badge + Brand Text */}
      <div className="flex items-center gap-3">
        {/* Hexagonal Cyan Emblem Box */}
        <div className="w-8 h-8 rounded-lg bg-[var(--color-obsidian-layer-1)] border border-[rgba(0,219,231,0.3)] flex items-center justify-center text-[var(--accent-fix)] shadow-[0_0_10px_rgba(0,219,231,0.3)]">
          <span className="material-symbols-outlined text-lg">hexagon</span>
        </div>

        {/* Circular J Badge */}
        <div className="w-6 h-6 rounded-full bg-[var(--color-obsidian-layer-2)] border border-[rgba(0,219,231,0.4)] flex items-center justify-center font-mono font-extrabold text-xs text-[var(--accent-fix)]">
          J
        </div>

        {/* Text Titles */}
        <div className="flex flex-col">
          <h1 className="text-xs font-extrabold tracking-[0.18em] uppercase font-mono text-[var(--accent-fix)] text-shadow-[0_0_10px_rgba(0,219,231,0.5)]">
            JON COMMAND CENTER
          </h1>
          <span className="tech-label text-[0.48rem] text-slate-500">OBSIDIAN AI OS</span>
        </div>
      </div>

      {/* Center: Navigation Tabs (Matching Reference Image) */}
      <nav className="hidden md:flex items-center gap-6">
        {TOP_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className="relative px-1 py-1 text-[0.68rem] font-bold tracking-[0.14em] transition-colors duration-150 cursor-pointer font-mono"
            style={{
              color: activeView === tab.id
                ? 'var(--accent-fix)'
                : 'var(--color-text-muted)',
            }}
          >
            {tab.label}
            {activeView === tab.id && (
              <span
                className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                style={{
                  background: 'var(--accent-fix)',
                  boxShadow: '0 0 8px var(--color-cyan-glow)',
                }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Far Right: Signal, Wi-Fi, Battery 96%, Sun Icon, VOICE LISTENING Status Pill */}
      <div className="flex items-center gap-3 md:gap-4 font-mono">
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <span className="material-symbols-outlined text-base" style={{ color: signalColor }}>
            {signalIcon}
          </span>

          <span className="material-symbols-outlined text-base" style={{ color: wifiColor }}>
            {wifiIcon}
          </span>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base" style={{ color: batteryColor }}>
              {batteryIcon}
            </span>
            <span className="text-[0.62rem] font-bold" style={{ color: batteryColor }}>
              96%
            </span>
          </div>
        </div>

        {/* Sun/Theme Toggle Icon */}
        <button
          onClick={toggleColorMode}
          className="text-[var(--color-text-muted)] hover:text-[var(--accent-fix)] transition-colors p-1 cursor-pointer"
          title={colorMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="material-symbols-outlined text-base">
            {colorMode === 'dark' ? 'wb_sunny' : 'dark_mode'}
          </span>
        </button>

        {/* Operator Badge & Logout Button */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-tech-border)]">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[0.62rem] font-bold text-[var(--color-text-primary)] font-mono truncate max-w-[100px]">
                {user.username}
              </span>
              <span className="text-[0.5rem] text-[var(--accent-fix)] font-mono font-semibold">
                {user.clearanceLevel}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Log out operator session"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        )}

        {/* VOICE LISTENING Status Pill (Matching Screenshot) */}
        <div className="status-pill-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan-fix)] shadow-[0_0_6px_var(--color-cyan-glow)] animate-pulse" />
          <span>VOICE LISTENING</span>
        </div>
      </div>
    </header>
  );
}
