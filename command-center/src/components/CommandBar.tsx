import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useWebSpeech } from '../hooks/useWebSpeech';

export default function CommandBar() {
  const { voiceState, setVoiceState, processCommand, settings, stopAssistantSpeech } = useApp();
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isAssistantSpeaking = voiceState === 'SPEAKING';

  const handleWakeWordCommand = useCallback((cmd: string) => {
    // Ignore incoming commands while assistant is actively speaking!
    if (voiceState === 'SPEAKING') return;

    setVoiceState('LISTENING');
    const cleanCmd = cmd.trim();

    if (!cleanCmd || cleanCmd.length < 2) return;

    setInputText(cleanCmd);
    processCommand(cleanCmd);
    setTimeout(() => {
      setInputText('');
    }, 400);
  }, [voiceState, setVoiceState, processCommand]);

  const { isListening, transcript, startListening, stopListening, isSupported, wakeWordDetected, resetWakeWord } = useWebSpeech({
    wakeWordEnabled: settings.wakeWordEnabled,
    onWakeWord: (cmd: string) => {
      handleWakeWordCommand(cmd);
      setTimeout(() => resetWakeWord(), 500);
    },
    isAssistantSpeaking,
  });

  useEffect(() => {
    if ((isListening || wakeWordDetected) && voiceState !== 'SPEAKING') {
      setVoiceState('LISTENING');
    }
  }, [isListening, wakeWordDetected, voiceState, setVoiceState]);

  useEffect(() => {
    if (transcript && !wakeWordDetected && voiceState !== 'SPEAKING') {
      setInputText(transcript);
    }
  }, [transcript, wakeWordDetected, voiceState]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    if (isAssistantSpeaking) {
      stopAssistantSpeech();
    }
    processCommand(text);
    setInputText('');
    resetWakeWord();
    inputRef.current?.focus();
  };

  const handleMicToggle = () => {
    if (isAssistantSpeaking) {
      stopAssistantSpeech();
      return;
    }

    if (!isSupported) {
      alert("Web Speech API SpeechRecognition is not supported in this browser. Please type your command into the prompt input.");
      return;
    }

    if (isListening) {
      stopListening();
      setVoiceState('IDLE');
      if (inputText.trim()) {
        setTimeout(() => handleSend(), 200);
      }
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div
        className="recessed-tray rounded-xl p-2 bg-[#1c1b1e] border border-[var(--color-tech-border-strong)]"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center gap-3 px-3 py-1">
          <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)]">
            terminal
          </span>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAssistantSpeaking
                ? "JON is transmitting... Press ESC or click STOP to interrupt..."
                : settings.wakeWordEnabled ? "Say 'Hey Jon...' -> Speak -> Waits 3s -> Executes & Mutes..." : "Type a command (e.g. open notepad, open google.com)..."
            }
            className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            style={{ fontFamily: 'var(--font-body)' }}
          />

          {/* Mic / Stop Response Button */}
          <button
            type="button"
            onClick={handleMicToggle}
            className="relative flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all duration-200 active:scale-95 flex-shrink-0"
            style={{
              background: isAssistantSpeaking
                ? 'radial-gradient(circle at 35% 35%, #3d1518 0%, #1c0a0c 100%)'
                : 'radial-gradient(circle at 35% 35%, #2a2a30 0%, #161619 100%)',
              border: isAssistantSpeaking ? '1px solid #ff5252' : '1px solid var(--accent-color, #00dbe7)',
              boxShadow: isAssistantSpeaking
                ? '0 0 16px rgba(255, 82, 82, 0.85), inset 0 0 8px rgba(0,0,0,0.8)'
                : (isListening || wakeWordDetected)
                ? '0 0 16px var(--accent-glow, rgba(0, 219, 231, 0.85)), inset 0 0 8px rgba(0,0,0,0.8)'
                : '0 0 8px var(--accent-glow, rgba(0, 219, 231, 0.35)), inset 0 1px 1px rgba(255, 255, 255, 0.12), 2px 3px 5px rgba(0, 0, 0, 0.6)',
            }}
            title={isAssistantSpeaking ? "Click to STOP assistant response instantly (HotKey: Esc)" : (isListening || wakeWordDetected) ? "Listening... Click to stop" : "Voice Input (Say 'Hey Jon')"}
          >
            <span
              className="material-symbols-outlined text-base transition-colors duration-200"
              style={{
                color: isAssistantSpeaking ? '#ff5252' : 'var(--accent-fix, #74f5ff)',
                textShadow: isAssistantSpeaking ? '0 0 8px rgba(255, 82, 82, 0.8)' : '0 0 8px var(--accent-glow, rgba(0, 219, 231, 0.7))',
                fontVariationSettings: "'FILL' 0, 'wght' 400",
              }}
            >
              {isAssistantSpeaking ? 'stop' : 'mic'}
            </span>

            {/* Glowing Pulse Ring */}
            {(isListening || wakeWordDetected || isAssistantSpeaking) && (
              <span
                className="absolute inset-0 rounded-full border opacity-75 pointer-events-none animate-ping"
                style={{ borderColor: isAssistantSpeaking ? '#ff5252' : 'var(--accent-fix, #74f5ff)' }}
              />
            )}
          </button>

          {/* Cyan Send Arrow Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="extruded-btn w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#242429' }}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}
            >
              send
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
