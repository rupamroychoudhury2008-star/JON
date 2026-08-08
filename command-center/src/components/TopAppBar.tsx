import { useApp, type ViewId } from '../context/AppContext';
import { useDeviceStatus } from '../hooks/useDeviceStatus';

const TOP_TABS: { id: ViewId; label: string }[] = [
  { id: 'session', label: 'SESSION' },
  { id: 'metrics', label: 'METRICS' },
  { id: 'logs', label: 'LOGS' },
];

export default function TopAppBar() {
  const { activeView, setActiveView, voiceState, colorMode, toggleColorMode } = useApp();
  const {
    batteryLevel,
    batteryIcon,
    batteryTooltip,
    batteryColor,
    wifiIcon,
    wifiTooltip,
    wifiColor,
    signalIcon,
    signalTooltip,
    signalColor,
  } = useDeviceStatus();

  const getStatusBadge = () => {
    switch (voiceState) {
      case 'LISTENING':
        return {
          label: 'VOICE ACTIVE',
          color: 'var(--accent-color, var(--color-cyan-dim))',
          bg: 'rgba(0, 219, 231, 0.08)',
          dotClass: 'bg-[var(--accent-color,var(--color-cyan-dim))] animate-[status-blink_1.2s_ease-in-out_infinite]',
        };
      case 'PROCESSING':
        return {
          label: 'PROCESSING',
          color: '#b388ff',
          bg: 'rgba(179,136,255,0.08)',
          dotClass: 'bg-[#b388ff] animate-pulse',
        };
      case 'SPEAKING':
        return {
          label: 'VOICE OUTPUT',
          color: '#ffba20',
          bg: 'rgba(255,186,32,0.08)',
          dotClass: 'bg-[#ffba20] animate-ping',
        };
      case 'ERROR':
        return {
          label: 'SYSTEM ERROR',
          color: '#ff5252',
          bg: 'rgba(255,82,82,0.08)',
          dotClass: 'bg-[#ff5252] animate-bounce',
        };
      default:
        return {
          label: 'VOICE ACTIVE',
          color: 'var(--accent-color, var(--color-cyan-dim))',
          bg: 'rgba(0, 219, 231, 0.08)',
          dotClass: 'bg-[var(--accent-color,var(--color-cyan-dim))]',
        };
    }
  };

  const status = getStatusBadge();

  return (
    <header
      className="flex items-center justify-between px-6 h-14 border-b border-[var(--color-tech-border)]"
      style={{ background: 'var(--color-surface)', backdropFilter: 'blur(10px)' }}
    >
      {/* Left: Brand Title */}
      <button
        onClick={() => setActiveView('voice')}
        className="flex items-center gap-3 text-left cursor-pointer group"
      >
        <h1
          className="text-base font-extrabold tracking-[0.16em] uppercase whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--accent-fix, var(--color-cyan-fix))',
            textShadow: '0 0 10px var(--accent-glow, rgba(0,219,231,0.45))',
          }}
        >
          JON COMMAND CENTER
        </h1>
      </button>

      {/* Center/Right-ish Sub-Nav Tabs */}
      <nav className="hidden md:flex items-center gap-6">
        {TOP_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className="relative px-2 py-1 text-xs font-semibold tracking-[0.14em] transition-colors duration-150 cursor-pointer"
            style={{
              fontFamily: 'var(--font-mono)',
              color: activeView === tab.id
                ? 'var(--accent-color, var(--color-cyan-dim))'
                : 'var(--color-text-muted)',
            }}
          >
            {tab.label}
            {activeView === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{
                  background: 'var(--accent-color, var(--color-cyan-dim))',
                  boxShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.5))',
                }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Right: Light/Dark Mode Toggle + Real Device Telemetry + Voice Active Pill */}
      <div className="flex items-center gap-4">
        {/* Light Mode / Dark Mode Toggle Button */}
        <button
          onClick={toggleColorMode}
          className="extruded-btn p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105"
          title={colorMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span
            className="material-symbols-outlined text-base"
            style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}
          >
            {colorMode === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Real Device Telemetry Icons (Signal, Wi-Fi, Battery) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Real Network Signal Strength */}
          <div className="flex items-center cursor-help" title={signalTooltip}>
            <span className="material-symbols-outlined text-base transition-colors duration-200" style={{ color: signalColor }}>
              {signalIcon}
            </span>
          </div>

          {/* Real Wi-Fi / Online Status */}
          <div className="flex items-center cursor-help" title={wifiTooltip}>
            <span className="material-symbols-outlined text-base transition-colors duration-200" style={{ color: wifiColor }}>
              {wifiIcon}
            </span>
          </div>

          {/* Real Battery Level & Charging Status */}
          <div className="flex items-center gap-1 cursor-help" title={batteryTooltip}>
            <span className="material-symbols-outlined text-base transition-colors duration-200" style={{ color: batteryColor }}>
              {batteryIcon}
            </span>
            <span className="text-[0.65rem] font-bold font-mono tracking-tighter" style={{ color: batteryColor }}>
              {batteryLevel}%
            </span>
          </div>
        </div>

        {/* Live Voice Status Pill */}
        <div
          className="status-pill text-[0.62rem] py-1 px-3"
          style={{
            background: status.bg,
            color: status.color,
            borderColor: 'var(--accent-color, var(--color-cyan-dim))',
            boxShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.25))',
          }}
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
          {status.label}
        </div>
      </div>
    </header>
  );
}
