import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MicControl from './MicControl';

export default function CommandBar() {
  const { voiceState, processCommand, stopAssistantSpeech, speechTranscript, isMicListening } = useApp();
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isAssistantSpeaking = voiceState === 'SPEAKING';
  const isProcessing = voiceState === 'PROCESSING';

  useEffect(() => {
    if (speechTranscript && isMicListening) {
      setInputText(speechTranscript);
    }
  }, [speechTranscript, isMicListening]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    if (isAssistantSpeaking) {
      stopAssistantSpeech();
    }
    processCommand(text);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full flex items-center justify-between gap-4 md:gap-6">
      {/* Far Left: Circular Microphone Dial + Live Waveform */}
      <MicControl />

      {/* Center: Recessed Command Input Box (Matching Screenshot) */}
      <div className="relative flex-1 flex flex-col justify-center recessed-input-box rounded-xl px-4 py-2.5 min-h-[64px]">
        <div className="flex items-center justify-between gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAssistantSpeaking
                ? "Assistant transmitting... (Esc to stop)"
                : isProcessing
                ? "Analyzing command..."
                : isMicListening
                ? "Listening to voice input..."
                : "Issue command to JON..."
            }
            className="w-full bg-transparent border-none outline-none text-xs text-[var(--color-text-primary)] placeholder-slate-600 font-mono"
          />

          {/* Three-dot menu icon on right side of input */}
          <button type="button" className="text-slate-600 hover:text-slate-400 transition-colors p-1 cursor-pointer">
            <span className="material-symbols-outlined text-base">more_vert</span>
          </button>
        </div>

        {/* Subtext at bottom of input box */}
        <span className="text-[0.52rem] font-mono text-slate-600 mt-1 select-none">
          Press Enter to send • Shift + Enter for newline
        </span>
      </div>

      {/* Far Right: Large Heavy Metallic EXECUTE Button (Matching Screenshot) */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!inputText.trim() || isProcessing}
        className="relative bezel-button px-6 py-4 rounded-xl font-mono text-xs font-extrabold text-[var(--accent-fix)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5 h-[64px] min-w-[130px] justify-center cursor-pointer group flex-shrink-0"
      >
        {/* Play Triangle Icon ▷ */}
        <span className="material-symbols-outlined text-lg text-[var(--accent-fix)] group-hover:scale-110 transition-transform">
          play_arrow
        </span>
        <span className="tracking-[0.16em]">EXECUTE</span>

        {/* Right side grip lines / LED indicators */}
        <div className="flex flex-col gap-1 ml-1">
          <span className="w-1 h-1 rounded-full bg-[var(--color-cyan-fix)] opacity-80" />
          <span className="w-1 h-1 rounded-full bg-[var(--color-cyan-fix)] opacity-80" />
          <span className="w-1 h-1 rounded-full bg-[var(--color-cyan-fix)] opacity-80" />
        </div>
      </button>
    </div>
  );
}
