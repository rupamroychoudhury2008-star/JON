import { useApp, type ViewId } from '../context/AppContext';
import { useWebSpeech } from '../hooks/useWebSpeech';

const MOBILE_TABS: { id: ViewId; icon: string; label: string }[] = [
  { id: 'appearance', icon: 'palette', label: 'Theme' },
  { id: 'connectivity', icon: 'network_check', label: 'Uplink' },
  { id: 'voice', icon: 'record_voice_over', label: 'Voice' },
  { id: 'diagnostics', icon: 'terminal', label: 'Diag' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

export default function MobileBottomDrawer() {
  const { activeView, setActiveView, setVoiceState, processCommand } = useApp();
  const { isListening, startListening, stopListening, isSupported } = useWebSpeech();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = document.getElementById('mobile-cmd-input') as HTMLInputElement;
    if (input?.value.trim()) {
      processCommand(input.value.trim());
      input.value = '';
    }
  };

  const handleMicToggle = () => {
    if (!isSupported) {
      alert("Speech recognition not supported in browser.");
      return;
    }
    if (isListening) {
      stopListening();
      setVoiceState('IDLE');
    } else {
      startListening();
      setVoiceState('LISTENING');
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-tech-border)]"
      style={{
        background: 'rgba(14, 14, 16, 0.98)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Pill-shaped Message Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex-1 flex items-center gap-2 recessed-tray px-3.5 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)]">terminal</span>
          <input
            id="mobile-cmd-input"
            type="text"
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            style={{ fontFamily: 'var(--font-body)' }}
          />

          {/* Premium Skeuomorphic Microphone Button */}
          <button
            type="button"
            onClick={handleMicToggle}
            className={`flex items-center justify-center p-1 rounded-full cursor-pointer transition-all ${
              isListening ? 'recessed-tray' : 'extruded-btn'
            }`}
            style={{
              background: isListening ? 'rgba(0, 219, 231, 0.15)' : '#242429',
              boxShadow: isListening ? '0 0 8px var(--accent-glow)' : 'none',
            }}
            title="Voice Input"
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}
            >
              {isListening ? 'mic' : 'mic_none'}
            </span>
          </button>
        </div>

        <button
          type="submit"
          className="extruded-btn w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>
            send
          </span>
        </button>
      </form>

      {/* 5-Column Navigation Grid */}
      <div className="grid grid-cols-5 gap-1 px-2 pb-3 pt-1">
        {MOBILE_TABS.map(tab => {
          const isSelected = activeView === tab.id;
          const isCenter = tab.id === 'voice';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                isSelected ? 'nav-btn active' : 'nav-btn'
              }`}
            >
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full ${
                  isCenter && isSelected ? 'bg-[var(--accent-subtle)] ring-1 ring-[var(--accent-color)]' : ''
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{
                    color: isSelected
                      ? 'var(--accent-color, var(--color-cyan-dim))'
                      : 'var(--color-text-muted)',
                    textShadow: isSelected
                      ? '0 0 6px var(--accent-glow, rgba(0,219,231,0.4))'
                      : 'none',
                  }}
                >
                  {tab.icon}
                </span>
              </div>
              <span
                className="text-[0.55rem] font-semibold tracking-wider"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isSelected
                    ? 'var(--accent-color, var(--color-cyan-dim))'
                    : 'var(--color-text-muted)',
                }}
              >
                {tab.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
