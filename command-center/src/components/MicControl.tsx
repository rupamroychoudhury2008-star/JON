import { useApp } from '../context/AppContext';

export default function MicControl() {
  const {
    voiceState, setVoiceState,
    stopAssistantSpeech,
    isMicListening,
    startMicListening, stopMicListening,
    isSpeechSupported, wakeWordDetected,
    micPermission, requestMicPermission,
  } = useApp();

  const isAssistantSpeaking = voiceState === 'SPEAKING';
  const isProcessing = voiceState === 'PROCESSING';
  const isDenied = micPermission === 'denied';

  const handleMicClick = async () => {
    if (isAssistantSpeaking) {
      stopAssistantSpeech();
      return;
    }

    if (isProcessing) return;

    if (!isSpeechSupported) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }

    if (micPermission === 'prompt') {
      const granted = await requestMicPermission();
      if (!granted) return;
    }

    if (isMicListening || wakeWordDetected) {
      stopMicListening();
      setVoiceState('IDLE');
    } else {
      setVoiceState('LISTENING');
      startMicListening();
    }
  };

  const getStatusText = () => {
    if (isDenied) return 'MIC DENIED';
    if (isAssistantSpeaking) return 'TRANSMITTING';
    if (isProcessing) return 'ANALYZING';
    if (isMicListening || wakeWordDetected) return 'LISTENING';
    if (voiceState === 'ERROR') return 'ERROR';
    return 'STANDBY';
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
      {/* Responsive Circular Dual-Bezel Microphone Knob/Dial */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={isProcessing}
        className="relative group w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 flex-shrink-0"
        style={{
          background: isMicListening
            ? 'radial-gradient(circle, var(--color-cyan-subtle) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: isMicListening
            ? '0 0 24px var(--color-cyan-glow), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.9)'
            : '0 6px 18px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.9)',
          border: `2px solid ${isDenied ? '#ef4444' : isMicListening ? 'var(--color-cyan-fix)' : 'var(--color-cyan-border)'}`,
        }}
        title={isAssistantSpeaking ? "Stop transmission (Esc)" : isMicListening ? "Stop listening" : "Start voice input"}
      >
        {/* Perimeter LED Dots (12 Dots around the rim) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
          <span
            key={deg}
            className={`absolute w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full transition-all duration-300 ${
              isMicListening || wakeWordDetected
                ? 'bg-[var(--color-cyan-fix)] shadow-[0_0_8px_var(--color-cyan-glow)] scale-125'
                : 'bg-slate-700 opacity-60'
            }`}
            style={{
              transform: `rotate(${deg}deg) translateY(-24px) sm:translateY(-28px) md:translateY(-34px)`,
            }}
          />
        ))}

        {/* Inner Recessed Button */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: isMicListening || wakeWordDetected
              ? 'radial-gradient(circle, var(--color-cyan-subtle) 0%, rgba(9, 13, 20, 0.95) 100%)'
              : 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            boxShadow: isMicListening
              ? 'inset 0 2px 8px rgba(0,0,0,0.9), 0 0 16px var(--color-cyan-glow)'
              : 'inset 0 2px 6px rgba(0,0,0,0.8), inset 0 -1px 1px rgba(255,255,255,0.1)',
            border: `1px solid ${isMicListening ? 'var(--color-cyan-fix)' : 'var(--color-cyan-border)'}`,
          }}
        >
          <span
            className="material-symbols-outlined text-lg sm:text-xl md:text-2xl transition-all"
            style={{
              color: isDenied ? '#ef4444' : isMicListening ? 'var(--color-cyan-fix)' : 'var(--color-text-secondary)',
              textShadow: isMicListening ? '0 0 14px var(--color-cyan-glow)' : 'none',
            }}
          >
            {isDenied ? 'mic_off' : isAssistantSpeaking ? 'stop' : isMicListening ? 'graphic_eq' : 'mic'}
          </span>
        </div>
      </button>

      {/* Label + Live Audio Waveform (Hidden on extra small screens for clean layout) */}
      <div className="hidden sm:flex flex-col gap-1 font-mono select-none">
        <span className="text-[0.6rem] md:text-[0.68rem] font-extrabold tracking-[0.16em] text-[var(--color-text-primary)]">
          MIC CONTROL
        </span>
        <span
          className="text-[0.52rem] md:text-[0.55rem] font-bold tracking-[0.16em]"
          style={{
            color: isDenied ? '#ef4444' : isMicListening ? 'var(--color-cyan-fix)' : 'var(--color-text-muted)',
          }}
        >
          {getStatusText()}
        </span>

        {/* Live Audio Waveform Bars */}
        <div className="flex items-center gap-1.5 h-4 md:h-5 mt-0.5">
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-1 shadow-[0_0_6px_var(--color-cyan-glow)]' : 'h-1.5 opacity-30'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-2 shadow-[0_0_6px_var(--color-cyan-glow)]' : 'h-3 opacity-30'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-3 shadow-[0_0_6px_var(--color-cyan-glow)]' : 'h-2 opacity-30'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-4 shadow-[0_0_6px_var(--color-cyan-glow)]' : 'h-4 opacity-30'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-2 shadow-[0_0_6px_var(--color-cyan-glow)]' : 'h-2 opacity-30'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-1 shadow-[0_0_6px_var(--color-cyan-glow)]' : 'h-1.5 opacity-30'}`} />
        </div>
      </div>
    </div>
  );
}
