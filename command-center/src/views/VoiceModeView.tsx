import { useApp } from '../context/AppContext';
import JonCore from '../components/JonCore';
import StatusLed from '../components/StatusLed';

export default function VoiceModeView() {
  const { voiceState, latestResponse, stopAssistantSpeech } = useApp();

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden animate-[fade-in_0.3s_ease-out] p-3 md:p-5 relative">
      {/* Main Machine Chassis Screen embedding JonCore Tactical Viewport */}
      <div className="flex-1 min-h-0 relative flex flex-col items-center justify-between overflow-hidden">
        <JonCore />

        {/* Latest Response Floating Overlay (Non-Intrusive Card) */}
        {latestResponse && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-30 animate-slide-up px-4 pointer-events-auto">
            <div className="rounded-2xl p-4 max-h-52 overflow-y-auto bg-[rgba(9,13,20,0.85)] backdrop-blur-xl border border-[rgba(0,219,231,0.35)] shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(0,219,231,0.15)] font-sans">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 font-mono">
                    <StatusLed status="cyan" size="sm" />
                    <span className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[var(--color-cyan-fix)] text-shadow-[0_0_8px_var(--color-cyan-glow)]">JON RESPONSE</span>
                    <span className="text-[0.55rem] text-[var(--color-text-muted)]">{timeStr}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-text-primary)] font-sans whitespace-pre-wrap selection:bg-[rgba(0,219,231,0.3)]">
                    {latestResponse}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(latestResponse)}
                    className="p-1.5 rounded-lg bg-[rgba(30,41,59,0.8)] border border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-cyan-fix)] hover:border-[rgba(0,219,231,0.3)] transition-all cursor-pointer"
                    title="Copy response to clipboard"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>

                  {voiceState === 'SPEAKING' && (
                    <button
                      type="button"
                      onClick={stopAssistantSpeech}
                      className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/30 text-red-300 flex items-center justify-center cursor-pointer hover:bg-red-900/90 transition-all shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                      title="Stop response speech (ESC)"
                    >
                      <span className="material-symbols-outlined text-sm">stop</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
