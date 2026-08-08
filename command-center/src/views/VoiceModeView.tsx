import { useApp } from '../context/AppContext';
import ShaderOrbCanvas from '../components/ShaderOrbCanvas';
import CommandBar from '../components/CommandBar';

export default function VoiceModeView() {
  const { voiceState, latestResponse, settings, updateSettings, stopAssistantSpeech } = useApp();

  const statusText = voiceState === 'LISTENING' ? 'JON IS LISTENING'
    : voiceState === 'PROCESSING' ? 'ANALYZING NEURAL DATA...'
    : voiceState === 'SPEAKING' ? 'JON IS TRANSMITTING'
    : voiceState === 'ERROR' ? 'SYSTEM ERROR DETECTED'
    : 'JON IS LISTENING';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] p-4 md:p-6">
      {/* Recessed Hero Canvas Tray matching reference image */}
      <div className="flex-1 relative recessed-tray rounded-xl overflow-hidden hud-corner-tl hud-corner-br dot-grid-bg flex flex-col items-center justify-between">
        
        {/* Top-Right Faint Framing Label */}
        <div className="absolute top-4 right-5 z-10 pointer-events-none">
          <span className="tech-label" style={{ fontSize: '0.58rem', color: 'rgba(140, 160, 165, 0.35)', letterSpacing: '0.18em' }}>
            SECURE_LINK_ESTABLISHED
          </span>
        </div>

        {/* Central WebGL Shader Orb */}
        <div className="w-full flex-1 relative flex items-center justify-center min-h-[260px]">
          <ShaderOrbCanvas />
        </div>

        {/* Unified Bottom Control Stack: Status -> Latency Chips -> Response -> Command Bar */}
        <div className="w-full flex flex-col items-center gap-3 z-10 pb-6">
          {/* Status Line + Instant Stop Speech Button */}
          <div className="flex items-center gap-3">
            <p
              className="text-xs md:text-sm font-bold tracking-[0.22em] uppercase text-center"
              style={{
                fontFamily: 'var(--font-mono)',
                color: voiceState === 'SPEAKING' ? '#ff5252' : 'var(--accent-color, var(--color-cyan-dim))',
                textShadow: voiceState === 'SPEAKING' ? '0 0 12px rgba(255,82,82,0.6)' : '0 0 10px var(--accent-glow, rgba(0,219,231,0.45))',
              }}
            >
              {statusText}
            </p>

            {voiceState === 'SPEAKING' && (
              <button
                type="button"
                onClick={stopAssistantSpeech}
                className="status-pill text-[0.6rem] px-3 py-1 bg-[#2a1215] text-[#ff5252] border border-[#ff5252] rounded-full cursor-pointer hover:bg-[#3d181c] transition-all flex items-center gap-1.5 animate-pulse"
                style={{
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 12px rgba(255,82,82,0.5)',
                }}
                title="Stop assistant speech output immediately (Hotkey: Esc)"
              >
                <span className="material-symbols-outlined text-xs">stop_circle</span>
                STOP RESPONSE (ESC)
              </button>
            )}
          </div>

          {/* Recessed Info Chips (Centered directly above Command Bar) */}
          <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => updateSettings({ wakeWordEnabled: !settings.wakeWordEnabled })}
              className="status-pill text-[0.58rem] px-3 py-1 bg-[var(--color-surface)] cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                color: settings.wakeWordEnabled ? 'var(--accent-fix, var(--color-cyan-fix))' : 'var(--color-text-muted)',
                borderColor: settings.wakeWordEnabled ? 'var(--accent-color, var(--color-cyan-dim))' : 'var(--color-tech-border)',
                fontFamily: 'var(--font-mono)',
                boxShadow: settings.wakeWordEnabled ? '0 0 8px var(--accent-glow, rgba(0,219,231,0.3))' : 'none',
              }}
              title="Click to toggle Wake Word ('Hey Jon') detection"
            >
              WAKE WORD: {settings.wakeWordEnabled ? "'HEY JON'" : 'OFF'}
            </button>

            <span
              className="status-pill text-[0.58rem] px-3 py-1 bg-[var(--color-surface)]"
              style={{
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--color-tech-border)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              LATENCY: 12ms
            </span>

            <button
              onClick={() => updateSettings({ noiseCancellation: !settings.noiseCancellation })}
              className="status-pill text-[0.58rem] px-3 py-1 bg-[var(--color-surface)] cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                color: settings.noiseCancellation ? 'var(--accent-color, var(--color-cyan-dim))' : 'var(--color-text-muted)',
                borderColor: 'var(--color-tech-border)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              NOISE CANCEL: {settings.noiseCancellation ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Latest Response Card Overlay */}
          {latestResponse && (
            <div className="w-full px-6 my-1 animate-[slide-up_0.3s_var(--ease-out-expo)]">
              <div
                className="recessed-tray rounded-lg p-3.5 max-w-xl mx-auto"
                style={{ background: 'var(--color-surface)', backdropFilter: 'blur(10px)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-sm" style={{ color: voiceState === 'SPEAKING' ? '#ff5252' : 'var(--accent-color, var(--color-cyan-dim))' }}>smart_toy</span>
                      <span className="tech-label" style={{ color: voiceState === 'SPEAKING' ? '#ff5252' : 'var(--accent-color, var(--color-cyan-dim))' }}>JON RESPONSE</span>
                      <span className="tech-label">{timeStr}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-body)' }}>
                      {latestResponse}
                    </p>
                  </div>

                  {/* Stop Speech Quick Action Icon in Response Card */}
                  {voiceState === 'SPEAKING' && (
                    <button
                      type="button"
                      onClick={stopAssistantSpeech}
                      className="w-7 h-7 rounded bg-[#2a1215] text-[#ff5252] border border-[#ff5252] flex items-center justify-center cursor-pointer hover:bg-[#3d181c] transition-colors"
                      title="Stop response speech (ESC)"
                    >
                      <span className="material-symbols-outlined text-base">stop</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Command Bar (Centered directly under Latency & Noise Cancel Chips) */}
          <CommandBar />
        </div>
      </div>
    </div>
  );
}
