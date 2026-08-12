import { useApp, type ViewId } from '../context/AppContext';

interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
}

const SIDE_NAV_ITEMS: NavItem[] = [
  { id: 'voice', label: 'JON CORE', icon: 'graphic_eq' },
  { id: 'session', label: 'SESSION', icon: 'terminal' },
  { id: 'tools', label: 'TOOLS', icon: 'psychology' },
  { id: 'memory', label: 'MEMORY', icon: 'format_list_bulleted' },
  { id: 'metrics', label: 'METRICS', icon: 'analytics' },
  { id: 'logs', label: 'LOGS', icon: 'find_in_page' },
  { id: 'system', label: 'SYSTEM', icon: 'settings_suggest' },
  { id: 'appearance', label: 'AUTOMATION', icon: 'bolt' },
  { id: 'connectivity', label: 'NETWORK', icon: 'hub' },
  { id: 'settings', label: 'SETTINGS', icon: 'settings' },
];

export default function SideNavBar() {
  const { activeView, setActiveView, isSidebarExpanded, setIsSidebarExpanded } = useApp();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between p-2 md:p-3 tactile-sidebar-panel transition-all duration-300 select-none border-r border-[rgba(0,219,231,0.15)] bg-[var(--color-obsidian-bg)]"
      style={{
        width: typeof window !== 'undefined' && window.innerWidth >= 768
          ? (isSidebarExpanded ? '200px' : '72px')
          : '64px',
      }}
    >
      {/* Top Section: Expand/Collapse Toggle */}
      <div className="flex items-center justify-between px-2 py-2 mb-2 flex-shrink-0">
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-[var(--color-obsidian-layer-1)] border border-[rgba(0,219,231,0.2)] text-[var(--accent-fix)] hover:border-[var(--color-cyan-fix)] transition-colors cursor-pointer"
          title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <span className="material-symbols-outlined text-base">
            {isSidebarExpanded ? 'menu_open' : 'menu'}
          </span>
        </button>
      </div>

      {/* 10 Tactical Navigation Buttons (Matching Reference Image) */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 min-h-0">
        {SIDE_NAV_ITEMS.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-[0.62rem] font-bold tracking-[0.14em] transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[rgba(0,219,231,0.12)] border border-[rgba(0,219,231,0.4)] text-[var(--accent-fix)] shadow-[0_0_12px_rgba(0,219,231,0.25)]'
                  : 'bg-[var(--color-obsidian-layer-1)] border border-[rgba(0,219,231,0.08)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[rgba(0,219,231,0.25)]'
              }`}
            >
              <span
                className="material-symbols-outlined text-lg flex-shrink-0"
                style={{
                  color: isActive ? 'var(--accent-fix)' : 'var(--color-text-muted)',
                  textShadow: isActive ? '0 0 8px var(--color-cyan-glow)' : 'none',
                }}
              >
                {item.icon}
              </span>
              <span className={`truncate ${isSidebarExpanded ? 'block' : 'hidden md:hidden'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
