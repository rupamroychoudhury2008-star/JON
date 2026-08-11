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
    <div className="flex items-center gap-4">
      {/* Large Circular Dual-Bezel Microphone Knob/Dial (Matching Screenshot) */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={isProcessing}
        className="relative group w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 flex-shrink-0"
        style={{
          background: 'linear-gradient(145deg, #18202a 0%, #080b0e 100%)',
          boxShadow: isMicListening
            ? '0 0 24px rgba(0,219,231,0.5), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.9)'
            : '0 8px 20px rgba(0,0,0,0.8), inset 0 2px 3px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.9)',
          border: `2px solid ${isDenied ? '#ff5252' : isMicListening ? 'var(--color-cyan-fix)' : 'rgba(0, 219, 231, 0.3)'}`,
        }}
        title={isAssistantSpeaking ? "Stop transmission (Esc)" : isMicListening ? "Stop listening" : "Start voice input"}
      >
        {/* Perimeter LED Dots (12 Dots around the rim) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
          <span
            key={deg}
            className={`absolute w-1 h-1 rounded-full transition-all ${
              isMicListening || wakeWordDetected
                ? 'bg-[var(--color-cyan-fix)] shadow-[0_0_6px_var(--color-cyan-glow)]'
                : 'bg-slate-700'
            }`}
            style={{
              transform: `rotate(${deg}deg) translateY(-34px)`,
            }}
          />
        ))}

        {/* Inner Recessed Ceramic Button */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150"
          style={{
            background: isMicListening || wakeWordDetected
              ? 'radial-gradient(circle, rgba(0, 219, 231, 0.35) 0%, rgba(5, 8, 11, 0.95) 100%)'
              : 'linear-gradient(180deg, #090c0f 0%, #121820 100%)',
            boxShadow: isMicListening
              ? 'inset 0 2px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,219,231,0.4)'
              : 'inset 0 2px 6px rgba(0,0,0,0.8), inset 0 -1px 1px rgba(255,255,255,0.08)',
            border: `1px solid ${isMicListening ? 'var(--color-cyan-fix)' : 'rgba(0, 219, 231, 0.2)'}`,
          }}
        >
          <span
            className="material-symbols-outlined text-2xl transition-all"
            style={{
              color: isDenied ? '#ff5252' : isMicListening ? 'var(--color-cyan-fix)' : 'var(--color-text-secondary)',
              textShadow: isMicListening ? '0 0 12px var(--color-cyan-glow)' : 'none',
            }}
          >
            {isDenied ? 'mic_off' : isAssistantSpeaking ? 'stop' : isMicListening ? 'graphic_eq' : 'mic'}
          </span>
        </div>
      </button>

      {/* Label + Live Audio Waveform (Matching Screenshot) */}
      <div className="flex flex-col gap-1 font-mono select-none">
        <span className="text-[0.68rem] font-extrabold tracking-[0.16em] text-[var(--color-text-primary)]">
          MIC CONTROL
        </span>
        <span
          className="text-[0.55rem] font-bold tracking-[0.18em]"
          style={{
            color: isDenied ? '#ff5252' : isMicListening ? 'var(--color-cyan-fix)' : 'var(--color-text-muted)',
          }}
        >
          {getStatusText()}
        </span>

        {/* Live Audio Waveform Bars */}
        <div className="flex items-center gap-1 h-5 mt-0.5">
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-1' : 'h-1.5 opacity-40'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-2' : 'h-3 opacity-40'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-3' : 'h-2 opacity-40'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-4' : 'h-4 opacity-40'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-2' : 'h-2 opacity-40'}`} />
          <span className={`w-1 bg-[var(--color-cyan-fix)] rounded-full ${isMicListening ? 'animate-wave-1' : 'h-1.5 opacity-40'}`} />
        </div>
      </div>
    </div>
  );
}
