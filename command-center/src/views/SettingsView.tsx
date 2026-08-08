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
    <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-y-auto animate-[fade-in_0.3s_ease-out]">
      <div>
        <h2
          className="text-lg font-bold tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
        >
          SETTINGS & SYSTEM CONFIG
        </h2>
        <p className="tech-label mt-1">VOICE PROFILE, COLOR MODE, AUDIO TOGGLES & CORE REBOOT</p>
      </div>

      {/* Light / Dark Color Mode Section */}
      <div className="recessed-tray rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>contrast</span>
          <span className="tech-label" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>INTERFACE COLOR MODE</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => setColorMode('dark')}
            className={`p-3 rounded-lg text-left cursor-pointer transition-all flex items-center justify-between ${
              colorMode === 'dark' ? 'recessed-tray border' : 'extruded-btn'
            }`}
            style={{ borderColor: colorMode === 'dark' ? 'var(--accent-color)' : undefined }}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg" style={{ color: 'var(--accent-color)' }}>dark_mode</span>
              <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>Dark Mode (Matte Charcoal)</span>
            </div>
            {colorMode === 'dark' && <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-color)' }}>check</span>}
          </button>

          <button
            onClick={() => setColorMode('light')}
            className={`p-3 rounded-lg text-left cursor-pointer transition-all flex items-center justify-between ${
              colorMode === 'light' ? 'recessed-tray border' : 'extruded-btn'
            }`}
            style={{ borderColor: colorMode === 'light' ? 'var(--accent-color)' : undefined }}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg" style={{ color: 'var(--accent-color)' }}>light_mode</span>
              <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>Light Mode (Matte Gray)</span>
            </div>
            {colorMode === 'light' && <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-color)' }}>check</span>}
          </button>
        </div>
      </div>

      <div className="recessed-tray rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>record_voice_over</span>
          <span className="tech-label" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>SYNTHETIC VOICE PROFILE</span>
        </div>
        <div className="space-y-2">
          {VOICE_PROFILES.map(profile => {
            const isSelected = settings.voiceModel === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => updateSettings({ voiceModel: profile.id })}
                className={`w-full p-3.5 rounded-lg text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected ? 'recessed-tray' : 'extruded-btn'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--accent-color, var(--color-cyan-dim))' : undefined,
                  boxShadow: isSelected ? 'inset 2px 2px 4px rgba(0,0,0,0.5), 0 0 8px var(--accent-glow, rgba(0,219,231,0.2))' : undefined,
                }}
              >
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: isSelected ? 'var(--accent-fix, var(--color-cyan-fix))' : 'var(--color-text-primary)',
                      textShadow: isSelected ? '0 0 6px var(--accent-glow, rgba(0,219,231,0.4))' : 'none',
                    }}
                  >
                    {profile.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                    {profile.desc}
                  </p>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="recessed-tray rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>volume_up</span>
              <div>
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>Auto-Speak Assistant Replies</p>
                <p className="tech-label mt-0.5" style={{ fontSize: '0.55rem' }}>AUTOMATIC TTS VOICE TRANSMISSION</p>
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

        <div className="recessed-tray rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>noise_control_off</span>
              <div>
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>Active Noise Cancellation</p>
                <p className="tech-label mt-0.5" style={{ fontSize: '0.55rem' }}>SUPPRESS AMBIENT MICROPHONE NOISE</p>
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

      <div className="recessed-tray rounded-lg p-5 border-l-4 border-l-[#ff5252]">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-2xl text-[#ff5252] mt-0.5">warning</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#ff5252]" style={{ fontFamily: 'var(--font-display)' }}>
              DANGER ZONE: CORE SYSTEM REBOOT
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4 leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
              Executing a core reboot will initiate a full-screen blackout, flush memory registers, reset active neural pathways, and reinitialize all spacecraft command subsystems.
            </p>
            <button
              onClick={triggerReboot}
              className="extruded-btn px-6 py-3 rounded-lg text-xs font-bold tracking-[0.14em] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger-text)',
                borderColor: 'rgba(255,100,100,0.4)',
              }}
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              REBOOT JON CORE NOW
            </button>
          </div>
        </div>
      </div>

      <div className="recessed-tray rounded-lg p-4">
        <p className="tech-label mb-2" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>SYSTEM INFRASTRUCTURE</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          {[
            ['APP TITLE', 'JON Command Center'],
            ['VERSION', 'v4.2.1-stable'],
            ['AI MODEL', 'Gemini 3.6 Flash'],
            ['BACKEND API', 'POST /api/command'],
            ['UI ENGINE', 'React + Tailwind v4'],
            ['CANVAS', 'WebGL2 GLSL ES 3.0'],
            ['VOICE API', 'Web Speech API'],
            ['CHARTS', 'Recharts Telemetry'],
          ].map(([label, val]) => (
            <div key={label}>
              <span className="text-[var(--color-text-muted)]">{label}: </span>
              <span className="text-[var(--color-text-primary)] font-semibold">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
