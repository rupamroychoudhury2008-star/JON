import { useApp, type ThemePalette, THEME_COLORS } from '../context/AppContext';

const PRESETS: { id: ThemePalette; label: string; primaryHex: string; dimHex: string; bgHex: string }[] = [
  { id: 'cyan', label: 'Aura Cyan', primaryHex: '#74f5ff', dimHex: '#00dbe7', bgHex: '#0e0e10' },
  { id: 'amber', label: 'Cyber Amber', primaryHex: '#ffe082', dimHex: '#ffba20', bgHex: '#14120e' },
  { id: 'emerald', label: 'Matrix Emerald', primaryHex: '#69f0ae', dimHex: '#00e676', bgHex: '#0f1411' },
  { id: 'violet', label: 'Violet Pulse', primaryHex: '#d1c4e9', dimHex: '#b388ff', bgHex: '#131118' },
];

export default function AppearanceView() {
  const { theme, setTheme, colorMode, setColorMode, settings, updateSettings } = useApp();

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-y-auto animate-[fade-in_0.3s_ease-out]">
      <div>
        <h2
          className="text-lg font-bold tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
        >
          APPEARANCE & HUD CONFIG
        </h2>
        <p className="tech-label mt-1">LIGHT / DARK THEME MODES & FEEDBACK CONFIG</p>
      </div>

      {/* Light Mode vs Dark Mode Selector Card */}
      <div>
        <p className="tech-label mb-3" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>INTERFACE COLOR MODE</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setColorMode('dark')}
            className={`p-4 rounded-xl text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
              colorMode === 'dark' ? 'recessed-tray border-2' : 'extruded-btn'
            }`}
            style={{
              borderColor: colorMode === 'dark' ? 'var(--accent-color, var(--color-cyan-dim))' : undefined,
              boxShadow: colorMode === 'dark' ? '0 0 14px var(--accent-glow, rgba(0,219,231,0.3))' : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#141416] border border-[#3a494b] flex items-center justify-center text-[#74f5ff]">
                <span className="material-symbols-outlined text-xl">dark_mode</span>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                  Deep Space Dark Mode
                </p>
                <p className="tech-label mt-0.5" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>
                  DEFAULT MATTE CHARCOAL HUD (#0E0E10)
                </p>
              </div>
            </div>
            {colorMode === 'dark' && (
              <span className="material-symbols-outlined text-xl" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>
                check_circle
              </span>
            )}
          </button>

          <button
            onClick={() => setColorMode('light')}
            className={`p-4 rounded-xl text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
              colorMode === 'light' ? 'recessed-tray border-2' : 'extruded-btn'
            }`}
            style={{
              borderColor: colorMode === 'light' ? 'var(--accent-color, var(--color-cyan-dim))' : undefined,
              boxShadow: colorMode === 'light' ? '0 0 14px var(--accent-glow, rgba(0,219,231,0.3))' : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f1f4f9] border border-[#cbd5e1] flex items-center justify-center text-[#475569]">
                <span className="material-symbols-outlined text-xl">light_mode</span>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                  Tactile Light Mode
                </p>
                <p className="tech-label mt-0.5" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>
                  CRISP LIGHT MATTE SKEUOMORPHIC (#F1F4F9)
                </p>
              </div>
            </div>
            {colorMode === 'light' && (
              <span className="material-symbols-outlined text-xl" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>
                check_circle
              </span>
            )}
          </button>
        </div>
      </div>

      <div>
        <p className="tech-label mb-3" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>ACCENT COLOR SCHEME PRESETS</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map(preset => {
            const colors = THEME_COLORS[preset.id];
            const isActive = theme === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setTheme(preset.id)}
                className={`relative p-4 rounded-lg transition-all duration-300 text-left cursor-pointer ${isActive ? 'recessed-tray' : 'extruded-btn'}`}
                style={{
                  borderColor: isActive ? colors.primary : undefined,
                  boxShadow: isActive ? `inset 2px 2px 4px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.05), 0 0 12px ${colors.glow}` : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full border border-[var(--color-tech-border)]" style={{ background: preset.primaryHex, boxShadow: `0 0 8px ${colors.glow}` }} title="Primary Light" />
                  <div className="w-5 h-5 rounded-full border border-[var(--color-tech-border)]" style={{ background: preset.dimHex }} title="Dim Accent" />
                  <div className="w-5 h-5 rounded-full border border-[var(--color-tech-border)]" style={{ background: preset.bgHex }} title="Background Surface" />
                </div>
                <p className="text-sm font-semibold" style={{ color: isActive ? colors.fix : 'var(--color-text-primary)', fontFamily: 'var(--font-display)', textShadow: isActive ? `0 0 8px ${colors.glow}` : 'none' }}>
                  {preset.label}
                </p>
                <p className="tech-label mt-0.5" style={{ fontSize: '0.55rem', color: isActive ? colors.primary : 'var(--color-text-muted)' }}>
                  {preset.id.toUpperCase()} PALETTE
                </p>
                {isActive && (
                  <span className="absolute top-2.5 right-2.5 material-symbols-outlined text-base" style={{ color: colors.primary }}>
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="recessed-tray rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>speed</span>
              <span className="tech-label" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>WEBGL SHADER PARTICLE SPEED</span>
            </div>
            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-fix, var(--color-cyan-fix))' }}>
              {settings.particleSpeed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={settings.particleSpeed}
            onChange={e => updateSettings({ particleSpeed: parseFloat(e.target.value) })}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between mt-2 font-mono text-[0.6rem] text-[var(--color-text-muted)]">
            <span>MIN (0.2x)</span>
            <span>MID (1.6x)</span>
            <span>MAX (3.0x)</span>
          </div>
        </div>

        <div className="recessed-tray rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>volume_up</span>
              <span className="tech-label" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>TACTILE AUDIO FEEDBACK VOLUME</span>
            </div>
            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-fix, var(--color-cyan-fix))' }}>
              {Math.round(settings.audioVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.audioVolume}
            onChange={e => updateSettings({ audioVolume: parseFloat(e.target.value) })}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between mt-2 font-mono text-[0.6rem] text-[var(--color-text-muted)]">
            <span>MIN (0%)</span>
            <span>MID (50%)</span>
            <span>MAX (100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
