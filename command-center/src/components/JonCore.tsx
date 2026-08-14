import { useApp } from '../context/AppContext';
import ShaderOrbCanvas from './ShaderOrbCanvas';
import StatusLed from './StatusLed';

export default function JonCore() {
  const { voiceState, settings, updateSettings } = useApp();

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 border border-[var(--color-cyan-border)] bg-[rgba(9,13,20,0.85)] backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.7),inset_0_0_30px_var(--color-cyan-subtle)] transition-all">

      {/* Futuristic Corner Framing Accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[var(--color-cyan-fix)] opacity-70" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[var(--color-cyan-fix)] opacity-70" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[var(--color-cyan-fix)] opacity-70" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[var(--color-cyan-fix)] opacity-70" />

      {/* Top Viewport Header Bar */}
      <div className="flex items-center justify-between z-20 flex-shrink-0 border-b border-[var(--color-cyan-border)] pb-3">
        <div className="flex items-center gap-3 font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--color-cyan-fix)] shadow-[0_0_8px_var(--color-cyan-glow)] animate-pulse" />
          <span className="text-[0.68rem] font-extrabold tracking-[0.2em] text-[var(--color-cyan-fix)] text-shadow-[0_0_8px_var(--color-cyan-glow)]">
            TACTICAL_CORE // JON AI
          </span>
          <span className="hidden sm:inline text-[0.55rem] font-bold tracking-[0.18em] text-[var(--color-text-muted)]">
            OPERATIONAL // OMEGA-7
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[0.62rem]">
          <span className="text-[var(--color-text-muted)] font-bold tracking-widest">STATE:</span>
          <span className="px-3 py-0.5 rounded-full text-[0.58rem] font-extrabold tracking-[0.16em] text-[var(--color-cyan-fix)] bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan-border-bright)] shadow-[0_0_12px_var(--color-cyan-glow)]">
            {voiceState === 'LISTENING' ? 'LISTENING' : voiceState === 'PROCESSING' ? 'PROCESSING' : voiceState === 'SPEAKING' ? 'TRANSMITTING' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Main Viewport Workspace: Axis Scale (Left) + Floating Orb Canvas (Center) + Telemetry Readouts (Right) */}
      <div className="relative flex-1 w-full flex items-center justify-between min-h-0 my-2">

        {/* Left Vertical Axis Coordinate Markings (-120 to 120) */}
        <div className="hidden sm:flex flex-col justify-between h-5/6 font-mono text-[0.5rem] text-[var(--color-text-muted)] z-20 select-none pl-2 border-l border-[var(--color-cyan-border)]">
          <span>+120</span>
          <span>+90</span>
          <span>+60</span>
          <span>+30</span>
          <span className="text-[var(--color-cyan-fix)] font-bold">00</span>
          <span>-30</span>
          <span>-60</span>
          <span>-90</span>
          <span>-120</span>
        </div>

        {/* Central Canvas Container for 3D Floating Particle Orb & Orbital Platform (Orb logic untouched) */}
        <div className="relative flex-1 h-full w-full flex items-center justify-center" style={{
          filter: 'drop-shadow(0 0 40px var(--color-cyan-glow)) drop-shadow(0 25px 50px rgba(0, 0, 0, 0.65))',
          transform: 'perspective(800px) translateZ(20px)',
          overflow: 'visible'
        }}>
          <ShaderOrbCanvas />
        </div>

        {/* Right Side Live Telemetry Readouts with Mini Progress Meters */}
        <div className="hidden md:flex flex-col gap-4 font-mono text-right z-20 pr-2 min-w-[120px] bg-[rgba(15,23,42,0.4)] p-3 rounded-xl border border-[rgba(255,255,255,0.05)]">
          {/* Core Temp */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-[var(--color-text-muted)]">CORE TEMP</span>
            <span className="text-sm font-extrabold tracking-wider text-[var(--color-cyan-fix)] mt-0.5">42°C</span>
            <div className="w-20 h-1.5 bg-[rgba(30,41,59,0.8)] rounded-full mt-1.5 overflow-hidden border border-[var(--color-cyan-border)]">
              <div className="h-full bg-[var(--color-cyan-fix)] rounded-full" style={{ width: '42%' }} />
            </div>
          </div>

          {/* CPU Load */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-[var(--color-text-muted)]">CPU LOAD</span>
            <span className="text-sm font-extrabold tracking-wider text-[var(--color-cyan-fix)] mt-0.5">23%</span>
            <div className="w-20 h-1.5 bg-[rgba(30,41,59,0.8)] rounded-full mt-1.5 overflow-hidden border border-[var(--color-cyan-border)]">
              <div className="h-full bg-[var(--color-cyan-fix)] rounded-full" style={{ width: '23%' }} />
            </div>
          </div>

          {/* Memory */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-[var(--color-text-muted)]">MEMORY</span>
            <span className="text-sm font-extrabold tracking-wider text-[var(--color-cyan-fix)] mt-0.5">6.1 GB</span>
            <div className="w-20 h-1.5 bg-[rgba(30,41,59,0.8)] rounded-full mt-1.5 overflow-hidden border border-[var(--color-cyan-border)]">
              <div className="h-full bg-[var(--color-cyan-fix)] rounded-full" style={{ width: '38%' }} />
            </div>
          </div>

          {/* Uptime */}
          <div className="flex flex-col items-end">
            <span className="text-[0.52rem] font-bold tracking-[0.18em] text-[var(--color-text-muted)]">UPTIME</span>
            <span className="text-sm font-extrabold tracking-wider text-[var(--color-cyan-fix)] mt-0.5">03:42:17</span>
            <div className="w-20 h-1.5 bg-[rgba(30,41,59,0.8)] rounded-full mt-1.5 overflow-hidden border border-[var(--color-cyan-border)]">
              <div className="h-full bg-[var(--color-cyan-fix)] rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Pills */}
      <div className="flex flex-col items-center gap-2.5 z-20 flex-shrink-0 pt-2 border-t border-[var(--color-cyan-border)]">
        <div className="status-pill-cyan">
          <StatusLed status="cyan" pulse={voiceState === 'LISTENING'} size="sm" />
          <span>VOICE RECEIVER ACTIVE</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center text-[0.55rem]">
          <button
            type="button"
            onClick={() => updateSettings({ wakeWordEnabled: !settings.wakeWordEnabled })}
            className="status-pill-cyan cursor-pointer hover:border-[var(--color-cyan-fix)] transition-all hover:scale-105"
          >
            <StatusLed status={settings.wakeWordEnabled ? 'cyan' : 'off'} size="sm" />
            <span>WAKE WORD: 'HEY JON'</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ noiseCancellation: !settings.noiseCancellation })}
            className="status-pill-green cursor-pointer hover:border-[#10b981] transition-all hover:scale-105"
          >
            <StatusLed status={settings.noiseCancellation ? 'green' : 'off'} size="sm" />
            <span>NOISE CANCEL: ACTIVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
