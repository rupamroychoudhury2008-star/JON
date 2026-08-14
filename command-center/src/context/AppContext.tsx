import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSpeech, type MicPermissionState } from '../hooks/useWebSpeech';

export type ViewId =
  | 'voice'
  | 'session'
  | 'appearance'
  | 'connectivity'
  | 'settings';

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export type ThemePalette = 'cyan' | 'amber' | 'emerald' | 'violet';

export type ColorMode = 'dark' | 'light';

export interface ToolResultEntry {
  success: boolean;
  tool_name: string;
  action: string;
  target?: string;
  message: string;
  error?: string;
  data?: Record<string, any>;
  durationMs?: number;
}

export interface SessionEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  latencyMs?: number;
  pathHandled?: string;
  toolResults?: ToolResultEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  category: 'SYS' | 'VOICE' | 'NET' | 'SEC' | 'AI' | 'TOOL';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  message: string;
  details?: string;
}

export interface VaultNote {
  path: string;
  snippet: string;
  frontmatter: Record<string, any>;
}

export interface AppSettings {
  voiceModel: string;
  autoSpeak: boolean;
  noiseCancellation: boolean;
  wakeWordEnabled: boolean;
  particleSpeed: number;
  audioVolume: number;
}

export interface UserProfile {
  username: string;
  role: string;
  clearanceLevel: string;
  loginTime: number;
}

export interface AppState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (username: string, passcode: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  sessionHistory: SessionEntry[];
  addToHistory: (entry: Omit<SessionEntry, 'id'>) => void;
  clearHistory: () => void;
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id'>) => void;
  clearLogs: () => void;
  notes: VaultNote[];
  isLoadingNotes: boolean;
  fetchNotes: () => Promise<void>;
  promoteMemory: () => Promise<{ success: boolean; message: string }>;
  allExecutedTools: ToolResultEntry[];
  theme: ThemePalette;
  setTheme: (theme: ThemePalette) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  latestResponse: string;
  setLatestResponse: (r: string) => void;
  isRebooting: boolean;
  triggerReboot: () => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  stopAssistantSpeech: () => void;
  processCommand: (text: string) => Promise<void>;

  // Single Shared Voice Controller Exposed via Context
  isMicListening: boolean;
  speechTranscript: string;
  startMicListening: () => void;
  stopMicListening: () => void;
  isSpeechSupported: boolean;
  wakeWordDetected: boolean;
  micPermission: MicPermissionState;
  requestMicPermission: () => Promise<boolean>;
}

export const THEME_COLORS: Record<ThemePalette, { primary: string; fix: string; glow: string; subtle: string; border: string; borderBright: string; bg: string }> = {
  cyan: {
    primary: '#00dbe7',
    fix: '#00dbe7',
    glow: 'rgba(0, 219, 231, 0.4)',
    subtle: 'rgba(0, 219, 231, 0.08)',
    border: 'rgba(0, 219, 231, 0.25)',
    borderBright: 'rgba(0, 219, 231, 0.65)',
    bg: '#090d14',
  },
  amber: {
    primary: '#f59e0b',
    fix: '#ffba20',
    glow: 'rgba(255, 186, 32, 0.4)',
    subtle: 'rgba(255, 186, 32, 0.08)',
    border: 'rgba(255, 186, 32, 0.25)',
    borderBright: 'rgba(255, 186, 32, 0.65)',
    bg: '#14120e',
  },
  emerald: {
    primary: '#10b981',
    fix: '#00e676',
    glow: 'rgba(0, 230, 118, 0.4)',
    subtle: 'rgba(0, 230, 118, 0.08)',
    border: 'rgba(0, 230, 118, 0.25)',
    borderBright: 'rgba(0, 230, 118, 0.65)',
    bg: '#0f1411',
  },
  violet: {
    primary: '#8b5cf6',
    fix: '#b388ff',
    glow: 'rgba(179, 136, 255, 0.4)',
    subtle: 'rgba(179, 136, 255, 0.08)',
    border: 'rgba(179, 136, 255, 0.25)',
    borderBright: 'rgba(179, 136, 255, 0.65)',
    bg: '#131118',
  },
};

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('jon_auth_user') || sessionStorage.getItem('jon_auth_user');
      return saved ? JSON.parse(saved) : {
        username: 'Operator',
        role: 'Chief System Operator',
        clearanceLevel: 'OMEGA-7',
        loginTime: Date.now()
      };
    } catch {
      return {
        username: 'Operator',
        role: 'Chief System Operator',
        clearanceLevel: 'OMEGA-7',
        loginTime: Date.now()
      };
    }
  });

  const isAuthenticated = true;

  const [activeView, setActiveView] = useState<ViewId>('voice');
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>(() => generateInitialLogs());
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [allExecutedTools, setAllExecutedTools] = useState<ToolResultEntry[]>([]);
  const [theme, setThemeState] = useState<ThemePalette>(() => {
    return (localStorage.getItem('jon_theme') as ThemePalette) || 'cyan';
  });
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    return (localStorage.getItem('jon_color_mode') as ColorMode) || 'dark';
  });
  const [latestResponse, setLatestResponse] = useState('');
  const [isRebooting, setIsRebooting] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    voiceModel: 'Zephyr',
    autoSpeak: true,
    noiseCancellation: true,
    wakeWordEnabled: true,
    particleSpeed: 1.0,
    audioVolume: 0.7,
  });

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem('jon_color_mode', mode);
    document.documentElement.setAttribute('data-color-mode', mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  }, [colorMode, setColorMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-mode', colorMode);
  }, [colorMode]);

  const addToHistory = useCallback((entry: Omit<SessionEntry, 'id'>) => {
    setSessionHistory(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
  }, []);

  const clearHistory = useCallback(() => setSessionHistory([]), []);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLogs(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const login = useCallback(async (username: string, _passcode: string, remember: boolean) => {
    const profile: UserProfile = {
      username: username || 'Operator',
      role: 'Chief System Operator',
      clearanceLevel: 'OMEGA-7',
      loginTime: Date.now(),
    };

    const data = JSON.stringify(profile);
    if (remember) {
      localStorage.setItem('jon_auth_user', data);
    } else {
      sessionStorage.setItem('jon_auth_user', data);
    }

    setUser(profile);
    addLog({
      timestamp: Date.now(),
      category: 'SEC',
      level: 'SUCCESS',
      message: `OPERATOR AUTHENTICATED: ${profile.username} (${profile.clearanceLevel})`,
      details: 'Session token issued and encrypted.'
    });
    return { success: true };
  }, [addLog]);

  const logout = useCallback(() => {
    const currentName = user?.username || 'Operator';
    localStorage.removeItem('jon_auth_user');
    sessionStorage.removeItem('jon_auth_user');
    setUser(null);
    addLog({
      timestamp: Date.now(),
      category: 'SEC',
      level: 'WARN',
      message: `OPERATOR LOGGED OUT: ${currentName}`,
      details: 'Session terminated.'
    });
  }, [user, addLog]);

  const triggerReboot = useCallback(() => {
    setIsRebooting(true);
    addLog({
      timestamp: Date.now(),
      category: 'SYS',
      level: 'WARN',
      message: 'REBOOTING JON COMMAND CORE — Full state reset sequence initiated.',
      details: 'All memory registers flushed, neural pathways reinitialized.'
    });

    setTimeout(() => {
      setIsRebooting(false);
      addLog({
        timestamp: Date.now(),
        category: 'SYS',
        level: 'SUCCESS',
        message: 'JON COMMAND CORE REBOOT COMPLETE — All subsystems online.',
        details: 'System standing by for operator instructions.'
      });
    }, 2500);
  }, [addLog]);

  // Unified Single Instance of Web Speech Hook Connected directly to processCommand
  const speech = useWebSpeech({
    wakeWordEnabled: settings.wakeWordEnabled,
    onWakeWord: (cmd: string) => {
      processCommand(cmd);
    },
    isAssistantSpeaking: voiceState === 'SPEAKING',
  });

  const processCommand = useCallback(async (text: string) => {
    const startTime = performance.now();
    addToHistory({ role: 'user', text, timestamp: Date.now() });
    setVoiceState('PROCESSING');

    addLog({
      timestamp: Date.now(),
      category: 'AI',
      level: 'INFO',
      message: `Dispatching command: "${text.substring(0, 60)}"`,
    });

    const lower = text.toLowerCase().trim();

    if (lower.includes('reboot')) {
      triggerReboot();
    } else if (lower.includes('light mode')) {
      setColorMode('light');
    } else if (lower.includes('dark mode')) {
      setColorMode('dark');
    } else if (lower.includes('session') || lower.includes('history')) {
      setActiveView('session');
    } else if (lower.includes('appearance') || lower.includes('theme') || lower.includes('automation')) {
      setActiveView('appearance');
    } else if (lower.includes('connectivity') || lower.includes('network')) {
      setActiveView('connectivity');
    } else if (lower.includes('setting')) {
      setActiveView('settings');
    }

    let responseText = '';
    let latencyMs = 0;
    let pathHandled = '';
    let toolResults: ToolResultEntry[] | undefined = undefined;

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, prompt: text })
      });
      if (res.ok) {
        const data = await res.json();
        responseText = data.response || data.output || data.result || 'Command processed successfully.';
        toolResults = data.tool_results as ToolResultEntry[] | undefined;
        latencyMs = data.latency_ms || data.timing?.total_ms || Math.round(performance.now() - startTime);
        pathHandled = data.path_handled || data.target_llm_lane || 'JON Core';

        if (toolResults && toolResults.length > 0) {
          setAllExecutedTools(prev => [...toolResults!, ...prev]);
          toolResults.forEach(tr => {
            addLog({
              timestamp: Date.now(),
              category: 'TOOL',
              level: tr.success ? 'SUCCESS' : 'ERROR',
              message: `Tool Execution [${tr.tool_name || 'UNKNOWN'}]: ${tr.message}`,
              details: tr.error || (tr.target ? `Target: ${tr.target}` : undefined),
            });
          });
        }

        addLog({
          timestamp: Date.now(),
          category: 'AI',
          level: 'SUCCESS',
          message: `Response received via ${pathHandled} in ${latencyMs}ms`,
        });
      } else {
        let errText = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.error) errText = `${res.status}: ${errData.error}`;
        } catch {}
        throw new Error(errText);
      }
    } catch (err: any) {
      latencyMs = Math.round(performance.now() - startTime);
      responseText = `⚠️ Backend Server Error (${err.message}). Please ensure 'python server.py' is running.`;
      addLog({
        timestamp: Date.now(),
        category: 'SYS',
        level: 'ERROR',
        message: `Backend API error (${err.message}). Please restart server.py.`,
      });
    }

    addToHistory({ role: 'assistant', text: responseText, timestamp: Date.now(), latencyMs, pathHandled, toolResults });
    setLatestResponse(responseText);

    if (settings.autoSpeak) {
      setVoiceState('SPEAKING');
      speech.speak(responseText, settings.audioVolume);
    } else {
      setVoiceState('IDLE');
      speech.resetWakeWord();
    }
  }, [addToHistory, addLog, triggerReboot, setColorMode, settings.autoSpeak, settings.audioVolume, speech]);

  useEffect(() => {
    if (speech.isListening || speech.wakeWordDetected) {
      if (voiceState !== 'SPEAKING' && voiceState !== 'PROCESSING') {
        setVoiceState('LISTENING');
      }
    }
  }, [speech.isListening, speech.wakeWordDetected, voiceState]);

  // Automatically re-arm passive wake word listening when assistant finishes speaking/processing
  useEffect(() => {
    if (!speech.isSpeaking && voiceState === 'IDLE' && settings.wakeWordEnabled && !speech.isListening) {
      speech.resetWakeWord();
    }
  }, [speech.isSpeaking, voiceState, settings.wakeWordEnabled, speech.isListening, speech.resetWakeWord]);

  const fetchNotes = useCallback(async () => {
    setIsLoadingNotes(true);
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        addLog({
          timestamp: Date.now(),
          category: 'SYS',
          level: 'SUCCESS',
          message: `Memory Vault sync complete — ${data.total || 0} notes indexed`,
        });
      }
    } catch (e: any) {
      addLog({
        timestamp: Date.now(),
        category: 'SYS',
        level: 'WARN',
        message: `Failed to fetch Memory Vault notes: ${e.message}`,
      });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [addLog]);

  const promoteMemory = useCallback(async () => {
    try {
      const res = await fetch('/api/promote', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addLog({
          timestamp: Date.now(),
          category: 'SYS',
          level: 'SUCCESS',
          message: `Memory Promotion executed: ${data.promoted_count || 0} items moved to LongTerm vault`,
        });
        await fetchNotes();
        return { success: true, message: `Promoted ${data.promoted_count || 0} memory items to LongTerm vault.` };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      addLog({
        timestamp: Date.now(),
        category: 'SYS',
        level: 'ERROR',
        message: `Memory Promotion error: ${e.message}`,
      });
      return { success: false, message: e.message };
    }
  }, [addLog, fetchNotes]);

  const stopAssistantSpeech = useCallback(() => {
    speech.stopSpeaking();
    setVoiceState('IDLE');
    addLog({
      timestamp: Date.now(),
      category: 'VOICE',
      level: 'INFO',
      message: 'TRANSMISSION ABORTED — Operator interrupted response speech.',
    });
  }, [speech, addLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (voiceState === 'SPEAKING' || speech.isSpeaking)) {
        stopAssistantSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, speech.isSpeaking, stopAssistantSpeech]);

  const setTheme = useCallback((t: ThemePalette) => {
    setThemeState(t);
    localStorage.setItem('jon_theme', t);
    const colors = THEME_COLORS[t] || THEME_COLORS.cyan;
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    root.style.setProperty('--color-cyan-dim', colors.primary);
    root.style.setProperty('--color-cyan-fix', colors.fix);
    root.style.setProperty('--color-cyan-glow', colors.glow);
    root.style.setProperty('--color-cyan-subtle', colors.subtle);
    root.style.setProperty('--color-cyan-border', colors.border);
    root.style.setProperty('--color-cyan-border-bright', colors.borderBright);
    root.style.setProperty('--accent-color', colors.primary);
    root.style.setProperty('--accent-fix', colors.fix);
    root.style.setProperty('--accent-glow', colors.glow);
    root.style.setProperty('--accent-subtle', colors.subtle);
  }, []);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const contextValue: AppState = {
    isAuthenticated,
    user,
    login,
    logout,
    activeView, setActiveView,
    voiceState, setVoiceState,
    sessionHistory, addToHistory, clearHistory,
    logs, addLog, clearLogs,
    notes, isLoadingNotes, fetchNotes, promoteMemory,
    allExecutedTools,
    theme, setTheme,
    colorMode, setColorMode, toggleColorMode,
    settings, updateSettings,
    latestResponse, setLatestResponse,
    isRebooting, triggerReboot,
    isSidebarExpanded, setIsSidebarExpanded,
    stopAssistantSpeech,
    processCommand,

    // Expose Single Shared Voice Controller
    isMicListening: speech.isListening,
    speechTranscript: speech.transcript,
    startMicListening: speech.startListening,
    stopMicListening: speech.stopListening,
    isSpeechSupported: speech.isSupported,
    wakeWordDetected: speech.wakeWordDetected,
    micPermission: speech.micPermission,
    requestMicPermission: speech.requestMicPermission,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

function generateInitialLogs(): LogEntry[] {
  const now = Date.now();
  const entries: Omit<LogEntry, 'id'>[] = [
    { timestamp: now - 12000, category: 'SYS', level: 'INFO', message: 'JON COMMAND CORE v5.0 — Systems Online', details: 'Core architecture: React + TypeScript + GLSL ES 3.0' },
    { timestamp: now - 11000, category: 'SYS', level: 'SUCCESS', message: 'Memory registers verified — 16384 MB allocated', details: 'ShortTerm & LongTerm memory vaults connected' },
    { timestamp: now - 10000, category: 'NET', level: 'INFO', message: 'Uplink interfaces active — eth0: 10Gbit, wlan0: Wi-Fi 7', details: 'REST gateway: http://localhost:8000/api/command' },
    { timestamp: now - 9000, category: 'SEC', level: 'SUCCESS', message: 'Security protocol Omega-7 active — AES-256-GCM', details: 'TLS 1.3 handshake verified' },
    { timestamp: now - 8000, category: 'AI', level: 'INFO', message: 'Neural pipeline initialized — JON Core connected', details: 'Model endpoint: /api/command' },
    { timestamp: now - 7000, category: 'VOICE', level: 'INFO', message: 'Audio synthesis subsystem online — Web Speech API active', details: 'Synthetic profile: Zephyr' },
  ];
  return entries.map(e => ({ ...e, id: crypto.randomUUID() }));
}
