import { useApp, type ViewId } from '../context/AppContext';

interface NavItem {
  id: ViewId;
  label: string;
  subLabel: string;
  icon: string;
  badge?: string;
}

const SIDE_NAV_ITEMS: NavItem[] = [
  { id: 'voice', label: 'JON CORE', subLabel: 'Voice Tactical Unit', icon: 'graphic_eq', badge: 'LIVE' },
  { id: 'session', label: 'SESSION', subLabel: 'Command Stream', icon: 'terminal', badge: 'LOGS' },
  { id: 'appearance', label: 'AUTOMATION', subLabel: 'HUD & Themes', icon: 'bolt', badge: 'HUD' },
  { id: 'connectivity', label: 'NETWORK', subLabel: 'Uplink Telemetry', icon: 'hub', badge: '10G' },
  { id: 'settings', label: 'SETTINGS', subLabel: 'System Config', icon: 'settings' },
];

export default function SideNavBar() {
  const { activeView, setActiveView, isSidebarExpanded, setIsSidebarExpanded } = useApp();

  return (
    <>
      {/* Mobile Backdrop Overlay when Drawer is Open */}
      {isSidebarExpanded && (
        <div
          onClick={() => setIsSidebarExpanded(false)}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-md z-40 animate-fadeIn"
        />
      )}

      {/* Ultra-Premium Glass Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col justify-between p-2.5 md:p-3 tactile-sidebar-panel transition-all duration-300 select-none border-r border-[var(--color-cyan-border)] bg-[rgba(9,13,20,0.92)] backdrop-blur-2xl shadow-[6px_0_30px_rgba(0,0,0,0.6)] ${
          isSidebarExpanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          width: typeof window !== 'undefined' && window.innerWidth >= 768
            ? (isSidebarExpanded ? '220px' : '72px')
            : '240px',
        }}
      >
        {/* Top Header Section */}
        <div className="flex flex-col flex-shrink-0 border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3 gap-2">
          <div className="flex items-center justify-between px-1">
            {/* Brand Logo & Name when Expanded */}
            <div className={`items-center gap-2.5 ${isSidebarExpanded ? 'flex' : 'hidden md:hidden'}`}>
              <div className="w-7 h-7 rounded-lg bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan-border-bright)] flex items-center justify-center text-[var(--color-cyan-fix)] shadow-[0_0_10px_var(--color-cyan-glow)]">
                <span className="material-symbols-outlined text-base">hexagon</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.68rem] font-extrabold font-mono tracking-[0.18em] text-[var(--color-cyan-fix)] text-shadow-[0_0_8px_var(--color-cyan-glow)]">
                  JON AI
                </span>
                <span className="text-[0.45rem] font-mono text-[var(--color-text-muted)] tracking-wider">COMMAND OS</span>
              </div>
            </div>

            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="w-full md:w-auto flex items-center justify-center p-2 rounded-xl bg-[rgba(15,23,42,0.7)] border border-[var(--color-cyan-border)] text-[var(--color-cyan-fix)] hover:bg-[var(--color-cyan-subtle)] hover:border-[var(--color-cyan-fix)] transition-all cursor-pointer shadow-[0_0_12px_var(--color-cyan-glow)] group"
              title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                {isSidebarExpanded ? 'menu_open' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Tactical Navigation Buttons */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 min-h-0">
          {SIDE_NAV_ITEMS.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setIsSidebarExpanded(false);
                  }
                }}
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl font-mono text-[0.65rem] font-extrabold tracking-[0.14em] transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan-border-bright)] text-[var(--color-cyan-fix)] shadow-[0_0_18px_var(--color-cyan-glow)]'
                    : 'bg-[rgba(15,23,42,0.4)] border border-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(30,41,59,0.5)] hover:border-[var(--color-cyan-border)]'
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--color-cyan-fix)] shadow-[0_0_10px_var(--color-cyan-glow)]" />
                )}

                {/* Icon */}
                <span
                  className="material-symbols-outlined text-xl flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    color: isActive ? 'var(--color-cyan-fix)' : 'var(--color-text-muted)',
                    textShadow: isActive ? '0 0 10px var(--color-cyan-glow)' : 'none',
                  }}
                >
                  {item.icon}
                </span>

                {/* Text Label & Sublabel */}
                <div className={`flex flex-col text-left truncate flex-1 ${isSidebarExpanded ? 'block' : 'block md:hidden'}`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[0.48rem] px-1.5 py-0.2 rounded font-mono font-bold ml-1 ${
                          isActive
                            ? 'bg-[var(--color-cyan-fix)] text-[#090d14]'
                            : 'bg-[rgba(255,255,255,0.08)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[0.48rem] text-[var(--color-text-muted)] font-normal tracking-normal truncate">
                    {item.subLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom System Status Widget */}
        <div className="flex-shrink-0 border-t border-[rgba(255,255,255,0.08)] pt-3 mt-2 font-mono">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[rgba(15,23,42,0.6)] border border-[rgba(255,255,255,0.06)]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse flex-shrink-0" />
            <div className={`flex flex-col truncate ${isSidebarExpanded ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[0.55rem] font-bold text-[var(--color-cyan-fix)] tracking-wider">CORE ONLINE</span>
              <span className="text-[0.46rem] text-[var(--color-text-muted)]">OMEGA-7 // 99.9%</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
