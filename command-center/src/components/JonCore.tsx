import { useApp } from '../context/AppContext';
import ShaderOrbCanvas from './ShaderOrbCanvas';
import StatusLed from './StatusLed';

export default function JonCore() {
  const { voiceState, settings, updateSettings } = useApp();

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 hud-corner-tl hud-corner-tr hud-corner-bl hud-corner-br border border-[rgba(0,219,231,0.15)] bg-[var(--color-obsidian-bg)] rounded-xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">

      {/* Top Viewport Header Bar */}
      <div className="flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3 font-mono">
          <span className="text-[0.62rem] font-extrabold tracking-[0.16em] text-[var(--accent-fix)]">
            TACTICAL_CORE
          </span>
          <span className="text-[0.52rem] font-bold tracking-[0.18em] text-slate-500">
            OPERATIONAL // OMEGA-7
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[0.62rem]">
          <span className="text-slate-500 font-bold tracking-widest">STATE:</span>
          <span className="px-2.5 py-0.5 rounded-full text-[0.58rem] font-bold tracking-[0.14em] text-[var(--accent-fix)] bg-[rgba(0,219,231,0.1)] border border-[rgba(0,219,231,0.3)] shadow-[0_0_8px_rgba(0,219,231,0.2)]">
            {voiceState === 'LISTENING' ? 'LISTENING' : voiceState === 'PROCESSING' ? 'PROCESSING' : voiceState === 'SPEAKING' ? 'TRANSMITTING' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Main Viewport Workspace: Axis Scale (Left) + Floating Orb Canvas (Center) + Telemetry Readouts (Right) */}
      <div className="relative flex-1 w-full flex items-center justify-between min-h-0 my-2">

        {/* Left Vertical Axis Coordinate Markings (-120 to 120) */}
        <div className="hidden sm:flex flex-col justify-between h-5/6 font-mono text-[0.5rem] text-slate-600 z-20 select-none pl-2 border-l border-[rgba(0,219,231,0.1)]">
          <span>120</span>
          <span>90</span>
          <span>60</span>
          <span>30</span>
          <span className="text-slate-400">00</span>
          <span>-30</span>
          <span>-60</span>
          <span>-90</span>
          <span>-120</span>
        </div>

        {/* Central Canvas Container for 3D Floating Particle Orb & Orbital Platform */}
        <div className="relative flex-1 h-full w-full flex items-center justify-center" style={{
          filter: 'drop-shadow(0 0 40px rgba(0, 219, 231, 0.15)) drop-shadow(0 25px 50px rgba(0, 0, 0, 0.6))',
          transform: 'perspective(800px) translateZ(20px)',
          overflow: 'visible'
        }}>
          <ShaderOrbCanvas />
        </div>

        {/* Right Side Live Telemetry Readouts (Matching Reference Image) */}
        <div className="hidden md:flex flex-col gap-5 font-mono text-right z-20 pr-2 min-w-[110px]">
          {/* Core Temp */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-slate-500">CORE TEMP</span>
            <span className="text-sm font-bold tracking-wider text-[var(--accent-fix)] mt-0.5">42°C</span>
            <div className="w-16 h-[1px] bg-[rgba(0,219,231,0.2)] mt-1" />
          </div>

          {/* CPU Load */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-slate-500">CPU LOAD</span>
            <span className="text-sm font-bold tracking-wider text-[var(--accent-fix)] mt-0.5">23%</span>
            <div className="w-16 h-[1px] bg-[rgba(0,219,231,0.2)] mt-1" />
          </div>

          {/* Memory */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-slate-500">MEMORY</span>
            <span className="text-sm font-bold tracking-wider text-[var(--accent-fix)] mt-0.5">6.1 GB</span>
            <div className="w-16 h-[1px] bg-[rgba(0,219,231,0.2)] mt-1" />
          </div>

          {/* Uptime */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-slate-500">UPTIME</span>
            <span className="text-sm font-bold tracking-wider text-[var(--accent-fix)] mt-0.5">03:42:17</span>
            <div className="w-16 h-[1px] bg-[rgba(0,219,231,0.2)] mt-1" />
          </div>
        </div>
      </div>

      {/* Bottom Status Pills (Matching Reference Image) */}
      <div className="flex flex-col items-center gap-2.5 z-20 flex-shrink-0 pt-1">
        <div className="status-pill-cyan">
          <StatusLed status="cyan" pulse={voiceState === 'LISTENING'} size="sm" />
          <span>VOICE RECEIVER ACTIVE</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center text-[0.55rem]">
          <button
            type="button"
            onClick={() => updateSettings({ wakeWordEnabled: !settings.wakeWordEnabled })}
            className="status-pill-cyan cursor-pointer hover:border-[var(--color-cyan-fix)] transition-colors"
          >
            <StatusLed status={settings.wakeWordEnabled ? 'cyan' : 'off'} size="sm" />
            <span>WAKE WORD: 'HEY JON'</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ noiseCancellation: !settings.noiseCancellation })}
            className="status-pill-green cursor-pointer hover:border-[#69f0ae] transition-colors"
          >
            <StatusLed status={settings.noiseCancellation ? 'green' : 'off'} size="sm" />
            <span>NOISE CANCEL: ACTIVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
