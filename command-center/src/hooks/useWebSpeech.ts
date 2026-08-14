import { useState, useCallback, useRef, useEffect } from 'react';

export type MicPermissionState = 'prompt' | 'granted' | 'denied';

interface WebSpeechHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, volume?: number) => void;
  stopSpeaking: () => void;
  unlockAudio: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  wakeWordDetected: boolean;
  resetWakeWord: () => void;
  micPermission: MicPermissionState;
  requestMicPermission: () => Promise<boolean>;
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
  const [micPermission, setMicPermission] = useState<MicPermissionState>('prompt');

  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef(false);
  const isStartingRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Pipeline Mode: 'PASSIVE' (waiting for "Hey Jon") | 'ACTIVE' (recording command) | 'MUTED' (locked/TTS)
  const pipelineModeRef = useRef<'PASSIVE' | 'ACTIVE' | 'MUTED'>('PASSIVE');
  const accumulatedSpeechRef = useRef<string>('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDispatchedTextRef = useRef<string>('');
  const restartRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAudioUnlockedRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSpeakingIdRef = useRef(0);

  // Pre-load and cache available voices asynchronously (critical for mobile browsers)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          voicesRef.current = available;
        }
      } catch {}
    };
    loadVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Audio Engine Unlocker for Mobile Autoplay Restrictions
  const unlockAudio = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (!isAudioUnlockedRef.current) {
        const dummy = new SpeechSynthesisUtterance(' ');
        dummy.volume = 0.01;
        dummy.rate = 10;
        window.speechSynthesis.speak(dummy);
        isAudioUnlockedRef.current = true;
      }
    } catch {}
  }, []);

  // Automatically trigger unlockAudio on initial mobile gesture (touch or click)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleGesture = () => {
      unlockAudio();
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
    };
    window.addEventListener('touchstart', handleGesture, { passive: true, once: true });
    window.addEventListener('click', handleGesture, { passive: true, once: true });
    return () => {
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
    };
  }, [unlockAudio]);

  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermission('denied');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately release test stream tracks after verifying permission
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      return true;
    } catch (err: any) {
      console.warn('Microphone permission check error:', err);
      setMicPermission('denied');
      return false;
    }
  }, []);

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
    if (isTTS) return;

    if (isRecognizingRef.current || isStartingRef.current) return;

    isStartingRef.current = true;

    if (restartRetryTimerRef.current) clearTimeout(restartRetryTimerRef.current);

    restartRetryTimerRef.current = setTimeout(() => {
      try {
        const isStillTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
        if (recognitionRef.current && !isStillTTS && !isRecognizingRef.current) {
          recognitionRef.current.start();
        }
      } catch (err: any) {
        isStartingRef.current = false;
      }
    }, 100);
  }, []);

  const dispatchCapturedCommand = useCallback((cmd: string) => {
    const cleanCmd = cmd.trim();
    pipelineModeRef.current = 'MUTED';
    setWakeWordDetected(false);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current && isRecognizingRef.current) {
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

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      isStartingRef.current = false;
      setIsListening(true);
      setMicPermission('granted');
    };

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
      isRecognizingRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
      const isTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
      if (!isTTS && (optionsRef.current?.wakeWordEnabled || pipelineModeRef.current === 'PASSIVE' || pipelineModeRef.current === 'ACTIVE')) {
        safeStartRecognition();
      }
    };

    recognition.onerror = (event: any) => {
      isRecognizingRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicPermission('denied');
      }
      const isTTS = optionsRef.current?.isAssistantSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
      if (!isTTS && (optionsRef.current?.wakeWordEnabled || pipelineModeRef.current === 'PASSIVE' || pipelineModeRef.current === 'ACTIVE')) {
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
      isRecognizingRef.current = false;
      isStartingRef.current = false;
      try { recognition.abort(); } catch {}
    };
  }, [isSupported, dispatchCapturedCommand, safeStartRecognition]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    const permitted = await requestMicPermission();
    if (!permitted) return;

    setTranscript('');
    setWakeWordDetected(true);
    pipelineModeRef.current = 'ACTIVE';
    accumulatedSpeechRef.current = '';

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      dispatchCapturedCommand(accumulatedSpeechRef.current);
    }, 3500);

    safeStartRecognition();
  }, [requestMicPermission, dispatchCapturedCommand, safeStartRecognition]);

  const stopListening = useCallback(() => {
    pipelineModeRef.current = 'MUTED';
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    isRecognizingRef.current = false;
    isStartingRef.current = false;
    setIsListening(false);
    setWakeWordDetected(false);
    accumulatedSpeechRef.current = '';
  }, []);

  const clearResumeInterval = () => {
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  };

  const stopSpeaking = useCallback(() => {
    currentSpeakingIdRef.current++;
    clearResumeInterval();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    setIsSpeaking(false);
    resetToPassiveListening();
  }, [resetToPassiveListening]);

  const speak = useCallback((text: string, volume = 0.7) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    pipelineModeRef.current = 'MUTED';
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    isRecognizingRef.current = false;
    isStartingRef.current = false;
    setIsListening(false);

    // Warm up / unlock audio engine on mobile
    unlockAudio();

    // Safely handle ongoing speech on mobile Safari
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    // Strip markdown tags and emojis for clean speech output
    const cleanText = text.replace(/[\*#`\_✅⚡🤖🗣️⚠️]/g, '').trim();
    if (!cleanText) return;

    // Mobile sentence chunking (prevents 15-second iOS Safari timeout)
    const rawParts = cleanText.split(/(?<=[.?!;\n])\s+/);
    const chunks: string[] = [];
    for (const part of rawParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.length > 160) {
        const subParts = trimmed.match(/.{1,160}(?:\s+|$)/g) || [trimmed];
        chunks.push(...subParts.map(s => s.trim()).filter(Boolean));
      } else {
        chunks.push(trimmed);
      }
    }

    if (chunks.length === 0) return;

    setIsSpeaking(true);
    const sessionId = ++currentSpeakingIdRef.current;

    // Mobile keep-alive timer for iOS Safari
    clearResumeInterval();
    resumeIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.paused) {
          try { window.speechSynthesis.resume(); } catch {}
        }
      }
    }, 3000);

    let currentIdx = 0;

    const speakNextChunk = (index: number) => {
      if (currentSpeakingIdRef.current !== sessionId) {
        clearResumeInterval();
        return;
      }

      if (index >= chunks.length) {
        clearResumeInterval();
        setIsSpeaking(false);
        resetToPassiveListening();
        return;
      }

      const chunkStr = chunks[index];
      const utterance = new SpeechSynthesisUtterance(chunkStr);
      utterance.rate = 0.95;
      utterance.pitch = 0.95;
      utterance.volume = Math.max(0.1, Math.min(1, volume));
      utterance.lang = 'en-US';

      try {
        const available = voicesRef.current.length > 0 ? voicesRef.current : (window.speechSynthesis.getVoices() || []);
        if (available && available.length > 0) {
          const preferred = available.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen'))
          );
          if (preferred) utterance.voice = preferred;
        }
      } catch {}

      utterance.onend = () => {
        if (currentSpeakingIdRef.current !== sessionId) return;
        currentIdx++;
        speakNextChunk(currentIdx);
      };

      utterance.onerror = (err) => {
        if (currentSpeakingIdRef.current !== sessionId) return;
        console.warn('SpeechSynthesis utterance error:', err);
        currentIdx++;
        if (currentIdx < chunks.length) {
          speakNextChunk(currentIdx);
        } else {
          clearResumeInterval();
          setIsSpeaking(false);
          resetToPassiveListening();
        }
      };

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {}

      // Short delay for iOS Safari speech cancellation queue buffer
      setTimeout(() => {
        if (currentSpeakingIdRef.current !== sessionId) return;
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('SpeechSynthesis speak failed:', e);
          clearResumeInterval();
          setIsSpeaking(false);
          resetToPassiveListening();
        }
      }, index === 0 ? 60 : 10);
    };

    speakNextChunk(0);
  }, [resetToPassiveListening, unlockAudio]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    unlockAudio,
    isSpeaking,
    isSupported,
    wakeWordDetected,
    resetWakeWord: resetToPassiveListening,
    micPermission,
    requestMicPermission,
  };
}
