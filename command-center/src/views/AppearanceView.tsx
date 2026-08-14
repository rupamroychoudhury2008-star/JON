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
    <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-y-auto animate-fadeIn">
      <div className="border-b border-[rgba(0,219,231,0.15)] pb-4">
        <h2
          className="text-lg font-extrabold tracking-[0.1em] text-[var(--color-cyan-fix)] text-shadow-[0_0_10px_var(--color-cyan-glow)] font-mono"
        >
          AUTOMATION & HUD APPEARANCE
        </h2>
        <p className="tech-label mt-1 text-[var(--color-text-muted)]">LIGHT / DARK THEME MODES & FEEDBACK CONFIG</p>
      </div>

      {/* Light Mode vs Dark Mode Selector Card */}
      <div>
        <p className="tech-label mb-3 text-[var(--color-cyan-fix)]">INTERFACE COLOR MODE</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setColorMode('dark')}
            className={`p-4 rounded-2xl text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
              colorMode === 'dark'
                ? 'bg-[rgba(0,219,231,0.1)] border-2 border-[var(--color-cyan-fix)] shadow-[0_0_20px_rgba(0,219,231,0.2)]'
                : 'extruded-btn border border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.4)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#090d14] border border-[rgba(0,219,231,0.3)] flex items-center justify-center text-[var(--color-cyan-fix)] shadow-[0_0_10px_rgba(0,219,231,0.2)]">
                <span className="material-symbols-outlined text-xl">dark_mode</span>
              </div>
              <div>
                <p className="text-sm font-bold font-sans text-[var(--color-text-primary)]">
                  Deep Space Dark Mode
                </p>
                <p className="tech-label mt-0.5 text-[0.55rem] text-[var(--color-text-muted)]">
                  OBSIDIAN & CYBER EMERALD HUD (#090D14)
                </p>
              </div>
            </div>
            {colorMode === 'dark' && (
              <span className="material-symbols-outlined text-xl text-[var(--color-cyan-fix)]">
                check_circle
              </span>
            )}
          </button>

          <button
            onClick={() => setColorMode('light')}
            className={`p-4 rounded-2xl text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
              colorMode === 'light'
                ? 'bg-[rgba(0,219,231,0.1)] border-2 border-[var(--color-cyan-fix)] shadow-[0_0_20px_rgba(0,219,231,0.2)]'
                : 'extruded-btn border border-[rgba(0,0,0,0.1)] bg-[rgba(255,255,255,0.6)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] flex items-center justify-center text-[#0284c7]">
                <span className="material-symbols-outlined text-xl">light_mode</span>
              </div>
              <div>
                <p className="text-sm font-bold font-sans text-[var(--color-text-primary)]">
                  Tactile Light Mode
                </p>
                <p className="tech-label mt-0.5 text-[0.55rem] text-[var(--color-text-muted)]">
                  CRISP MATTE AEROSPACE (#F8FAFC)
                </p>
              </div>
            </div>
            {colorMode === 'light' && (
              <span className="material-symbols-outlined text-xl text-[var(--color-cyan-fix)]">
                check_circle
              </span>
            )}
          </button>
        </div>
      </div>

      <div>
        <p className="tech-label mb-3 text-[var(--color-cyan-fix)]">ACCENT COLOR SCHEME PRESETS</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PRESETS.map(preset => {
            const colors = THEME_COLORS[preset.id];
            const isActive = theme === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setTheme(preset.id)}
                className={`relative p-4 rounded-2xl transition-all duration-300 text-left cursor-pointer border ${
                  isActive
                    ? 'bg-[rgba(15,23,42,0.8)] shadow-lg'
                    : 'bg-[rgba(15,23,42,0.4)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,219,231,0.3)]'
                }`}
                style={{
                  borderColor: isActive ? colors.primary : undefined,
                  boxShadow: isActive ? `0 0 16px ${colors.glow}` : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full border border-[var(--color-tech-border)] shadow-sm" style={{ background: preset.primaryHex }} title="Primary Accent" />
                  <div className="w-5 h-5 rounded-full border border-[var(--color-tech-border)] shadow-sm" style={{ background: preset.dimHex }} title="Dim Accent" />
                  <div className="w-5 h-5 rounded-full border border-[var(--color-tech-border)] shadow-sm" style={{ background: preset.bgHex }} title="Background Surface" />
                </div>
                <p className="text-sm font-bold font-mono" style={{ color: isActive ? colors.fix : 'var(--color-text-primary)' }}>
                  {preset.label}
                </p>
                <p className="tech-label mt-0.5 text-[0.55rem]" style={{ color: isActive ? colors.primary : 'var(--color-text-muted)' }}>
                  {preset.id.toUpperCase()} PALETTE
                </p>
                {isActive && (
                  <span className="absolute top-3 right-3 material-symbols-outlined text-base" style={{ color: colors.primary }}>
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.15)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[var(--color-cyan-fix)]">speed</span>
              <span className="tech-label text-[var(--color-cyan-fix)]">WEBGL SHADER PARTICLE SPEED</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-[var(--color-cyan-fix)]">
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
            className="w-full cursor-pointer accent-[var(--color-cyan-fix)]"
          />
          <div className="flex justify-between mt-2 font-mono text-[0.6rem] text-[var(--color-text-muted)]">
            <span>MIN (0.2x)</span>
            <span>MID (1.6x)</span>
            <span>MAX (3.0x)</span>
          </div>
        </div>

        <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.15)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[var(--color-cyan-fix)]">volume_up</span>
              <span className="tech-label text-[var(--color-cyan-fix)]">TACTILE AUDIO FEEDBACK VOLUME</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-[var(--color-cyan-fix)]">
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
            className="w-full cursor-pointer accent-[var(--color-cyan-fix)]"
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
