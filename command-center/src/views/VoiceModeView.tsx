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

        {/* Latest Response Floating Overlay (Non-Intrusive Obsidian Card) */}
        {latestResponse && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-30 animate-[slide-up_0.3s_ease-out] px-4 pointer-events-auto">
            <div className="rounded-xl p-4 max-h-48 overflow-y-auto bg-[#070b10]/90 backdrop-blur-md border border-[rgba(0,219,231,0.3)] shadow-[0_8px_24px_rgba(0,0,0,0.85)] font-sans">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 font-mono">
                    <StatusLed status="cyan" size="sm" />
                    <span className="text-[0.58rem] font-bold tracking-widest text-[var(--accent-fix)]">JON RESPONSE</span>
                    <span className="text-[0.55rem] text-slate-500">{timeStr}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-text-primary)] font-sans whitespace-pre-wrap">
                    {latestResponse}
                  </p>
                </div>

                {voiceState === 'SPEAKING' && (
                  <button
                    type="button"
                    onClick={stopAssistantSpeech}
                    className="p-1.5 rounded bg-[#3b0707] text-[#fca5a5] flex items-center justify-center cursor-pointer hover:bg-[#571010] transition-colors"
                    title="Stop response speech (ESC)"
                  >
                    <span className="material-symbols-outlined text-sm">stop</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
