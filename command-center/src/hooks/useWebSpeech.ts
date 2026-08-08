import { useState, useCallback, useRef, useEffect } from 'react';

interface WebSpeechHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, volume?: number) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  wakeWordDetected: boolean;
  resetWakeWord: () => void;
}

export function useWebSpeech(options?: {
  wakeWordEnabled?: boolean;
  onWakeWord?: (command: string) => void;
  isAssistantSpeaking?: boolean;
}): WebSpeechHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Pipeline Mode: 'PASSIVE' (waiting for "Hey Jon") | 'ACTIVE' (recording command) | 'MUTED' (TTS response)
  const pipelineModeRef = useRef<'PASSIVE' | 'ACTIVE' | 'MUTED'>('PASSIVE');
  const accumulatedSpeechRef = useRef<string>('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDispatchedTextRef = useRef<string>('');
  const restartRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const checkWakeWord = (text: string): { matches: boolean; commandPayload: string } => {
    const lower = text.toLowerCase().trim();
    const wakePatterns = [
      'hey jon', 'hey john', 'hi jon', 'hi john',
      'ok jon', 'ok john', 'okay jon', 'okay john',
      'hello jon', 'hello john', 'jon', 'john'
    ];

    for (const pattern of wakePatterns) {
      if (lower.startsWith(pattern)) {
        const cmd = lower.replace(pattern, '').replace(/^[,\s.:?!]+/, '').trim();
        return { matches: true, commandPayload: cmd };
      } else if (lower.includes(pattern)) {
        const parts = lower.split(pattern);
        const cmd = parts[parts.length - 1].replace(/^[,\s.:?!]+/, '').trim();
        return { matches: true, commandPayload: cmd };
      }
    }
    return { matches: false, commandPayload: '' };
  };

  const safeStartRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    const isTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
    if (isTTS || pipelineModeRef.current === 'MUTED') return;

    const isPassiveAllowed = Boolean(optionsRef.current?.wakeWordEnabled) && pipelineModeRef.current === 'PASSIVE';
    const isActiveAllowed = pipelineModeRef.current === 'ACTIVE';

    if (!isPassiveAllowed && !isActiveAllowed) return;

    try {
      recognitionRef.current.abort();
    } catch {}

    if (restartRetryTimerRef.current) clearTimeout(restartRetryTimerRef.current);

    restartRetryTimerRef.current = setTimeout(() => {
      try {
        const isStillTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
        if (recognitionRef.current && !isStillTTS && (pipelineModeRef.current === 'PASSIVE' || pipelineModeRef.current === 'ACTIVE')) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch {
        setTimeout(() => {
          try {
            if (recognitionRef.current && (pipelineModeRef.current === 'PASSIVE' || pipelineModeRef.current === 'ACTIVE')) {
              recognitionRef.current.start();
              setIsListening(true);
            }
          } catch {}
        }, 300);
      }
    }, 150);
  }, []);

  const dispatchCapturedCommand = useCallback((cmd: string) => {
    const cleanCmd = cmd.trim();
    pipelineModeRef.current = 'MUTED';
    setWakeWordDetected(false);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);

    if (cleanCmd && cleanCmd.length >= 2 && cleanCmd !== lastDispatchedTextRef.current) {
      lastDispatchedTextRef.current = cleanCmd;
      if (optionsRef.current?.onWakeWord) {
        optionsRef.current.onWakeWord(cleanCmd);
      }
    }
    accumulatedSpeechRef.current = '';
  }, []);

  const resetToPassiveListening = useCallback(() => {
    pipelineModeRef.current = 'PASSIVE';
    setWakeWordDetected(false);
    accumulatedSpeechRef.current = '';
    lastDispatchedTextRef.current = '';
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    safeStartRecognition();
  }, [safeStartRecognition]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const isTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
      if (isTTS || pipelineModeRef.current === 'MUTED') return;

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += chunk;
        } else {
          interim += chunk;
        }
      }

      const speechChunk = (final || interim).trim();
      if (!speechChunk) return;

      // MODE 1: PASSIVE LISTENER (Waiting for "Hey Jon")
      if (pipelineModeRef.current === 'PASSIVE') {
        const { matches, commandPayload } = checkWakeWord(speechChunk);
        if (matches) {
          pipelineModeRef.current = 'ACTIVE';
          setWakeWordDetected(true);
          accumulatedSpeechRef.current = commandPayload;
          setTranscript(commandPayload || 'Listening...');

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            dispatchCapturedCommand(accumulatedSpeechRef.current);
          }, 3000);
        }
      }
      // MODE 2: ACTIVE COMMAND CAPTURE (Recording command)
      else if (pipelineModeRef.current === 'ACTIVE') {
        const { commandPayload } = checkWakeWord(speechChunk);
        const currentText = commandPayload || speechChunk;
        accumulatedSpeechRef.current = currentText;
        setTranscript(currentText);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          dispatchCapturedCommand(accumulatedSpeechRef.current);
        }, 3000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const isTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
      if (!isTTS && (pipelineModeRef.current === 'PASSIVE' || pipelineModeRef.current === 'ACTIVE')) {
        safeStartRecognition();
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'network') {
        console.warn('Web Speech API requires internet connectivity for browser speech-to-text.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition status:', event.error);
      }
      setIsListening(false);
      const isTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
      if (!isTTS && (pipelineModeRef.current === 'PASSIVE' || pipelineModeRef.current === 'ACTIVE')) {
        safeStartRecognition();
      }
    };

    recognitionRef.current = recognition;

    if (optionsRef.current?.wakeWordEnabled) {
      safeStartRecognition();
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (restartRetryTimerRef.current) clearTimeout(restartRetryTimerRef.current);
      try { recognition.abort(); } catch {}
    };
  }, [isSupported, dispatchCapturedCommand, safeStartRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setWakeWordDetected(true);
    pipelineModeRef.current = 'ACTIVE';
    accumulatedSpeechRef.current = '';

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      dispatchCapturedCommand(accumulatedSpeechRef.current);
    }, 3500);

    safeStartRecognition();
  }, [dispatchCapturedCommand, safeStartRecognition]);

  const stopListening = useCallback(() => {
    pipelineModeRef.current = 'MUTED';
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    setIsListening(false);
    setWakeWordDetected(false);
    accumulatedSpeechRef.current = '';
  }, []);

  const speak = useCallback((text: string, volume = 0.7) => {
    if (!window.speechSynthesis) return;

    pipelineModeRef.current = 'MUTED';
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    setIsListening(false);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      resetToPassiveListening();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      resetToPassiveListening();
    };

    window.speechSynthesis.speak(utterance);
  }, [resetToPassiveListening]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    resetToPassiveListening();
  }, [resetToPassiveListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSpeaking,
    isSupported,
    wakeWordDetected,
    resetWakeWord: resetToPassiveListening,
  };
}
