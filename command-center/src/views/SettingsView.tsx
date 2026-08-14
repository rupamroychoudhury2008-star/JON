import { useApp } from '../context/AppContext';

const VOICE_PROFILES = [
  { id: 'Zephyr', name: 'Zephyr (Default)', desc: 'Balanced & Neutral — Standard aerospace tactical cadence' },
  { id: 'Kore', name: 'Kore (Authoritative)', desc: 'Low Resonance — Deep register, precise command enunciation' },
  { id: 'Puck', name: 'Puck (High Cadence)', desc: 'Energetic — Faster speech delivery, telemetry-optimized' },
  { id: 'Fenrir', name: 'Fenrir (Sub-Harmonic)', desc: 'Calm & Resonant — Low frequency synthesis, deliberate pacing' },
];

export default function SettingsView() {
  const { settings, updateSettings, triggerReboot, colorMode, setColorMode } = useApp();

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-y-auto animate-fadeIn">
      <div className="border-b border-[rgba(0,219,231,0.15)] pb-4">
        <h2
          className="text-lg font-extrabold tracking-[0.1em] text-[var(--color-cyan-fix)] text-shadow-[0_0_10px_var(--color-cyan-glow)] font-mono"
        >
          SETTINGS & SYSTEM CONFIG
        </h2>
        <p className="tech-label mt-1 text-[var(--color-text-muted)]">VOICE PROFILE, COLOR MODE, AUDIO TOGGLES & CORE REBOOT</p>
      </div>

      {/* Light / Dark Color Mode Section */}
      <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.18)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base text-[var(--color-cyan-fix)]">contrast</span>
          <span className="tech-label text-[var(--color-cyan-fix)]">INTERFACE COLOR MODE</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <button
            onClick={() => setColorMode('dark')}
            className={`p-4 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between border ${
              colorMode === 'dark'
                ? 'bg-[rgba(0,219,231,0.1)] border-[var(--color-cyan-fix)] shadow-[0_0_14px_rgba(0,219,231,0.2)]'
                : 'extruded-btn border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.4)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[var(--color-cyan-fix)]">dark_mode</span>
              <span className="text-xs font-bold font-mono text-[var(--color-text-primary)]">Dark Mode (Obsidian)</span>
            </div>
            {colorMode === 'dark' && <span className="material-symbols-outlined text-sm text-[var(--color-cyan-fix)]">check</span>}
          </button>

          <button
            onClick={() => setColorMode('light')}
            className={`p-4 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between border ${
              colorMode === 'light'
                ? 'bg-[rgba(0,219,231,0.1)] border-[var(--color-cyan-fix)] shadow-[0_0_14px_rgba(0,219,231,0.2)]'
                : 'extruded-btn border-[rgba(0,0,0,0.1)] bg-[rgba(255,255,255,0.6)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[var(--color-cyan-fix)]">light_mode</span>
              <span className="text-xs font-bold font-mono text-[var(--color-text-primary)]">Light Mode (Aerospace Gray)</span>
            </div>
            {colorMode === 'light' && <span className="material-symbols-outlined text-sm text-[var(--color-cyan-fix)]">check</span>}
          </button>
        </div>
      </div>

      <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.18)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base text-[var(--color-cyan-fix)]">record_voice_over</span>
          <span className="tech-label text-[var(--color-cyan-fix)]">SYNTHETIC VOICE PROFILE</span>
        </div>
        <div className="space-y-2.5">
          {VOICE_PROFILES.map(profile => {
            const isSelected = settings.voiceModel === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => updateSettings({ voiceModel: profile.id })}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 border ${
                  isSelected
                    ? 'bg-[rgba(0,219,231,0.1)] border-[var(--color-cyan-fix)] shadow-[0_0_16px_rgba(0,219,231,0.2)]'
                    : 'bg-[rgba(15,23,42,0.4)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,219,231,0.25)]'
                }`}
              >
                <div>
                  <p
                    className="text-sm font-bold font-mono"
                    style={{
                      color: isSelected ? 'var(--color-cyan-fix)' : 'var(--color-text-primary)',
                      textShadow: isSelected ? '0 0 8px var(--color-cyan-glow)' : 'none',
                    }}
                  >
                    {profile.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                    {profile.desc}
                  </p>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-lg flex-shrink-0 text-[var(--color-cyan-fix)]">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.18)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[var(--color-cyan-fix)]">volume_up</span>
              <div>
                <p className="text-sm font-bold font-sans">Auto-Speak Assistant Replies</p>
                <p className="tech-label mt-0.5 text-[0.55rem]">AUTOMATIC TTS VOICE TRANSMISSION</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })}
              className={`toggle-switch ${settings.autoSpeak ? 'active' : ''}`}
              title={settings.autoSpeak ? "Auto-Speak Enabled" : "Auto-Speak Disabled"}
            />
          </div>
        </div>

        <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.18)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[var(--color-cyan-fix)]">noise_control_off</span>
              <div>
                <p className="text-sm font-bold font-sans">Active Noise Cancellation</p>
                <p className="tech-label mt-0.5 text-[0.55rem]">SUPPRESS AMBIENT MICROPHONE NOISE</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ noiseCancellation: !settings.noiseCancellation })}
              className={`toggle-switch ${settings.noiseCancellation ? 'active' : ''}`}
              title={settings.noiseCancellation ? "Noise Cancellation Enabled" : "Noise Cancellation Disabled"}
            />
          </div>
        </div>
      </div>

      <div className="recessed-tray rounded-2xl p-5 border-l-4 border-l-[#ef4444] border border-red-500/20 bg-red-950/20 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-2xl text-[#ef4444] mt-0.5">warning</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#ef4444] font-mono tracking-wider">
              DANGER ZONE: CORE SYSTEM REBOOT
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4 leading-relaxed font-mono">
              Executing a core reboot will initiate a full-screen blackout, flush memory registers, reset active neural pathways, and reinitialize all spacecraft command subsystems.
            </p>
            <button
              onClick={triggerReboot}
              className="extruded-btn px-6 py-3 rounded-xl text-xs font-mono font-bold tracking-[0.14em] flex items-center gap-2 cursor-pointer transition-all active:scale-95 text-red-300 bg-red-950/60 border-red-500/40 hover:bg-red-900/80 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              REBOOT JON CORE NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
