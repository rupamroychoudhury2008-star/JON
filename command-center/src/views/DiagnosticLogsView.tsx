import { useState, useEffect, useRef } from 'react';
import { useApp, type LogEntry } from '../context/AppContext';

const CATEGORIES = ['ALL', 'SYS', 'VOICE', 'NET', 'SEC', 'AI'] as const;
type FilterCat = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<string, string> = {
  SYS: '#74f5ff',
  VOICE: '#ffba20',
  NET: '#00e676',
  SEC: '#ff5252',
  AI: '#b388ff',
};

const LEVEL_COLORS: Record<string, { text: string; bg: string }> = {
  INFO: { text: 'var(--color-cyan-dim)', bg: 'rgba(0,219,231,0.1)' },
  WARN: { text: '#ffba20', bg: 'rgba(255,186,32,0.1)' },
  ERROR: { text: '#ff5252', bg: 'rgba(255,82,82,0.1)' },
  SUCCESS: { text: '#00e676', bg: 'rgba(0,230,118,0.1)' },
  DEBUG: { text: '#5f6368', bg: 'rgba(95,99,104,0.1)' },
};

const LOG_TEMPLATES: Omit<LogEntry, 'id' | 'timestamp'>[] = [
  { category: 'SYS', level: 'INFO', message: 'Heartbeat check — all subsystems nominal', details: 'Core load: 24.1%' },
  { category: 'NET', level: 'SUCCESS', message: 'Packet round-trip: 14ms — jitter: 2.1ms', details: 'Uplink frequency: 28.5 GHz' },
  { category: 'VOICE', level: 'DEBUG', message: 'PCM buffer flush — 256 samples processed @ 48kHz', details: 'Audio sync status: OK' },
  { category: 'AI', level: 'INFO', message: 'Neural pipeline idle — await queue: 0', details: 'Gemini Flash endpoint active' },
  { category: 'SEC', level: 'SUCCESS', message: 'Firewall scan complete — 0 threats detected', details: 'Encryption: Omega-7 AES-256' },
  { category: 'NET', level: 'WARN', message: 'Orbital transceiver signal jitter: 34.2 dB', details: 'SNR threshold warning' },
];

export default function DiagnosticLogsView() {
  const { logs, addLog, clearLogs } = useApp();
  const [filter, setFilter] = useState<FilterCat>('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      addLog({ ...template, timestamp: Date.now() });
    }, 4000);
    return () => clearInterval(interval);
  }, [addLog]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter(log => {
    if (filter !== 'ALL' && log.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return log.message.toLowerCase().includes(q) || (log.details && log.details.toLowerCase().includes(q));
    }
    return true;
  });

  const exportTXT = () => {
    const text = filtered.map(log => {
      const ts = new Date(log.timestamp).toISOString();
      return `[${ts}] [${log.category}] [${log.level}] ${log.message} ${log.details ? `(${log.details})` : ''}`;
    }).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jon-diagnostic-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-4 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-lg font-bold tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
          >
            DIAGNOSTIC TERMINAL LOGS
          </h2>
          <p className="tech-label mt-1">{filtered.length} LOG ENTRIES CAPTURED</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`extruded-btn px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer ${autoScroll ? '' : 'opacity-50'}`}
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color, var(--color-cyan-dim))' }}
          >
            <span className="material-symbols-outlined text-sm">vertical_align_bottom</span>
            AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={exportTXT}
            disabled={filtered.length === 0}
            className="extruded-btn px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color, var(--color-cyan-dim))' }}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            EXPORT .TXT
          </button>
          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="extruded-btn px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-danger-text)', background: 'var(--color-danger-bg)' }}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            CLEAR
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider transition-all cursor-pointer ${filter === cat ? 'recessed-tray' : 'extruded-btn'}`}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: filter === cat
                  ? (cat === 'ALL' ? 'var(--accent-color, var(--color-cyan-dim))' : CATEGORY_COLORS[cat] || 'var(--color-text-primary)')
                  : 'var(--color-text-muted)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="recessed-tray rounded-md flex items-center gap-2 px-3 py-1.5">
            <span className="material-symbols-outlined text-sm text-[var(--color-text-muted)]">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search diagnostic logs..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 recessed-tray rounded-lg p-3.5 overflow-y-auto overflow-x-hidden space-y-1"
        style={{ background: '#0a0a0b' }}
      >
        {filtered.map((log) => {
          const lvl = LEVEL_COLORS[log.level] || LEVEL_COLORS.INFO;
          return (
            <div
              key={log.id}
              className="flex items-start gap-2 py-1 px-2 text-xs leading-5 hover:bg-[rgba(255,255,255,0.03)] rounded-sm transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="text-[var(--color-text-muted)] flex-shrink-0 w-16">{formatTime(log.timestamp)}</span>
              <span
                className="flex-shrink-0 w-12 font-bold text-center text-[0.6rem] px-1 py-0.2 rounded"
                style={{ color: CATEGORY_COLORS[log.category] || 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.04)' }}
              >
                {log.category}
              </span>
              <span
                className="flex-shrink-0 text-[0.6rem] font-bold px-1.5 py-0.2 rounded"
                style={{ color: lvl.text, background: lvl.bg }}
              >
                {log.level}
              </span>
              <span className="text-[var(--color-text-primary)] flex-1">
                {log.message}
                {log.details && (
                  <span className="text-[var(--color-text-muted)] italic ml-2" style={{ fontSize: '0.7rem' }}>
                    — {log.details}
                  </span>
                )}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-12" style={{ fontFamily: 'var(--font-mono)' }}>
            No log entries match the selected filter.
          </p>
        )}
      </div>
    </div>
  );
}
