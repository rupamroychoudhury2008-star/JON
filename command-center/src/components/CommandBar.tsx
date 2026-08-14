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
    <div className="w-full flex items-center justify-between gap-1.5 sm:gap-4 md:gap-6 max-w-full overflow-hidden">
      {/* Far Left: Circular Microphone Dial + Live Waveform */}
      <MicControl />

      {/* Center: Recessed Command Input Box */}
      <div className="relative flex-1 flex flex-col justify-center recessed-input-box px-2.5 sm:px-4 py-1.5 sm:py-2.5 min-h-[44px] sm:min-h-[52px] md:min-h-[64px] overflow-hidden">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAssistantSpeaking
                ? "Assistant transmitting..."
                : isProcessing
                ? "Analyzing command..."
                : isMicListening
                ? "Listening..."
                : "Issue command..."
            }
            className="w-full bg-transparent border-none outline-none text-[0.75rem] sm:text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] font-mono font-medium truncate"
          />

          {/* Action menu icon */}
          <button type="button" className="hidden sm:inline-block text-[var(--color-text-muted)] hover:text-[var(--color-cyan-fix)] transition-colors p-1 cursor-pointer">
            <span className="material-symbols-outlined text-base">more_vert</span>
          </button>
        </div>

        {/* Subtext at bottom of input box */}
        <div className="hidden sm:flex items-center justify-between text-[0.52rem] font-mono text-[var(--color-text-muted)] mt-1 select-none">
          <span>Press <kbd className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-[var(--color-cyan-fix)] font-bold">Enter ↵</kbd> to send</span>
          <span className="hidden md:inline text-[var(--color-cyan-fix)] opacity-80">JON NLP V2.4</span>
        </div>
      </div>

      {/* Far Right: Heavy Metallic / Cyber EXECUTE Button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!inputText.trim() || isProcessing}
        className="relative bezel-button px-2.5 py-1.5 sm:px-6 sm:py-3.5 rounded-xl font-mono text-xs font-extrabold text-[var(--color-cyan-fix)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2.5 h-[44px] sm:h-[52px] md:h-[64px] min-w-[40px] sm:min-w-[135px] justify-center cursor-pointer group flex-shrink-0"
      >
        {/* Play Icon */}
        <span className="material-symbols-outlined text-xl text-[var(--color-cyan-fix)] group-hover:scale-125 transition-transform duration-200">
          play_arrow
        </span>
        <span className="hidden sm:inline tracking-[0.18em]">EXECUTE</span>

        {/* Right side LED indicators (Desktop) */}
        <div className="hidden md:flex flex-col gap-1 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan-fix)] shadow-[0_0_6px_var(--color-cyan-glow)] animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan-fix)] opacity-60" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan-fix)] opacity-30" />
        </div>
      </button>
    </div>
  );
}
