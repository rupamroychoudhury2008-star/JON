import { useApp, type ViewId } from '../context/AppContext';

interface NavItem {
  id: ViewId;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'voice', icon: 'record_voice_over', label: 'Voice Mode' },
  { id: 'session', icon: 'history', label: 'Session' },
  { id: 'metrics', icon: 'analytics', label: 'Metrics' },
  { id: 'logs', icon: 'list_alt', label: 'Logs' },
  { id: 'appearance', icon: 'palette', label: 'Appearance' },
  { id: 'connectivity', icon: 'network_check', label: 'Connectivity' },
  { id: 'diagnostics', icon: 'terminal', label: 'Diagnostics' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

export default function SideNavBar() {
  const { activeView, setActiveView, triggerReboot, isSidebarExpanded, setIsSidebarExpanded } = useApp();

  const handleSupportClick = () => {
    alert("Support Subsystem Initialized:\nTransmitting emergency orbital distress beacon...\nTech Team notified (Support ID: #JON-SUP-9042)");
  };

  const handleLogoutClick = () => {
    alert("Operator Session Terminated:\nLogged out from JON Spacecraft Command Core.");
  };

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30 border-r border-[var(--color-tech-border)] transition-all duration-300"
      style={{
        width: isSidebarExpanded ? '240px' : '72px',
        background: 'var(--color-surface)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={() => setIsSidebarExpanded(true)}
      onMouseLeave={() => setIsSidebarExpanded(false)}
    >
      {/* Top Header Logo Circle */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-tech-border)] h-14 flex-shrink-0">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 recessed-tray"
          style={{ background: 'var(--color-elevated)' }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{
              color: 'var(--accent-color, var(--color-cyan-dim))',
              textShadow: '0 0 10px var(--accent-glow, rgba(0,219,231,0.5))',
            }}
          >
            graphic_eq
          </span>
        </div>
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            width: isSidebarExpanded ? '140px' : '0',
            opacity: isSidebarExpanded ? 1 : 0,
          }}
        >
          <p
            className="text-xs font-bold tracking-[0.14em] whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--accent-fix, var(--color-cyan-fix))',
            }}
          >
            JON SYSTEM
          </p>
          <p className="tech-label whitespace-nowrap" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>
            COMMAND ACTIVE
          </p>
        </div>
      </div>

      {/* Nav Buttons */}
      <nav className="flex-1 flex flex-col gap-1.5 px-2.5 py-4 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-150 cursor-pointer ${
                isActive ? 'extruded-btn border-l-2' : 'nav-btn'
              }`}
              style={{
                borderLeftColor: isActive ? 'var(--accent-color, var(--color-cyan-dim))' : 'transparent',
                background: isActive ? 'var(--color-elevated)' : 'transparent',
              }}
              title={item.label}
            >
              <span
                className="material-symbols-outlined text-xl flex-shrink-0"
                style={{
                  color: isActive
                    ? 'var(--accent-color, var(--color-cyan-dim))'
                    : 'var(--color-text-secondary)',
                  textShadow: isActive
                    ? '0 0 8px var(--accent-glow, rgba(0,219,231,0.5))'
                    : 'none',
                }}
              >
                {item.icon}
              </span>
              <span
                className="text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
                style={{
                  width: isSidebarExpanded ? '130px' : '0',
                  opacity: isSidebarExpanded ? 1 : 0,
                  color: isActive
                    ? 'var(--accent-color, var(--color-cyan-dim))'
                    : 'var(--color-text-secondary)',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Support & Reboot Core Button */}
      <div className="px-2.5 py-3 border-t border-[var(--color-tech-border)] space-y-2 flex-shrink-0">
        <button
          onClick={triggerReboot}
          className="extruded-btn flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[0.68rem] font-bold tracking-[0.1em] cursor-pointer"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger-text)',
            borderColor: 'rgba(255,100,100,0.3)',
          }}
          title="Reboot Core System"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          <span
            className="overflow-hidden transition-all duration-300 whitespace-nowrap"
            style={{ width: isSidebarExpanded ? '90px' : '0', opacity: isSidebarExpanded ? 1 : 0 }}
          >
            REBOOT CORE
          </span>
        </button>

        <div className="flex items-center justify-around py-1">
          <button
            onClick={handleSupportClick}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            title="Help / Support"
          >
            <span className="material-symbols-outlined text-lg">help</span>
          </button>
          <button
            onClick={handleLogoutClick}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            title="Log Out"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
