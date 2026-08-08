import { useState } from 'react';
import { useApp, type SessionEntry } from '../context/AppContext';
import { useWebSpeech } from '../hooks/useWebSpeech';

export default function SessionHistoryView() {
  const { sessionHistory, clearHistory, settings } = useApp();
  const { speak } = useWebSpeech();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery
    ? sessionHistory.filter(e => e.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessionHistory;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(sessionHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jon-session-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-4 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-lg font-bold tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
          >
            SESSION TRANSCRIPT
          </h2>
          <p className="tech-label mt-1">{sessionHistory.length} TURNS RECORDED</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportJSON}
            disabled={sessionHistory.length === 0}
            className="extruded-btn px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color, var(--color-cyan-dim))' }}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            EXPORT JSON
          </button>
          <button
            onClick={clearHistory}
            disabled={sessionHistory.length === 0}
            className="extruded-btn px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-danger-text)', background: 'var(--color-danger-bg)' }}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            CLEAR
          </button>
        </div>
      </div>

      <div className="recessed-tray rounded-lg p-0.5">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transcript by keyword..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-text-muted)] py-16">
            <span className="material-symbols-outlined text-5xl opacity-40">history</span>
            <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono)' }}>No session entries recorded yet.</p>
            <p className="text-xs text-[var(--color-text-muted)]">Start a conversation in Voice Mode or issue a command.</p>
          </div>
        ) : (
          filtered.map((entry: SessionEntry) => {
            const isUser = entry.role === 'user';
            return (
              <div
                key={entry.id}
                className={`flex flex-col gap-1 ${isUser ? 'items-start mr-8' : 'items-end ml-8'}`}
              >
                <div
                  className="recessed-tray rounded-lg p-3.5 w-full max-w-2xl animate-[fade-in_0.2s_ease-out]"
                  style={{
                    borderLeft: isUser ? '3px solid #ffba20' : '3px solid var(--accent-color, var(--color-cyan-dim))',
                    background: isUser ? 'rgba(20,20,24,0.7)' : 'rgba(20,20,24,0.95)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm" style={{
                        color: isUser ? '#ffba20' : 'var(--accent-color, var(--color-cyan-dim))',
                      }}>
                        {isUser ? 'person' : 'smart_toy'}
                      </span>
                      <span className="tech-label font-bold" style={{
                        color: isUser ? '#ffba20' : 'var(--accent-color, var(--color-cyan-dim))',
                      }}>
                        {isUser ? 'OPERATOR' : 'JON AI'}
                      </span>
                      <span className="tech-label">{formatTime(entry.timestamp)}</span>
                      {entry.latencyMs !== undefined && (
                        <span className="status-pill text-[0.55rem] py-0.5 px-2" style={{
                          background: 'var(--accent-subtle, rgba(0,219,231,0.08))',
                          color: 'var(--accent-color, var(--color-cyan-dim))',
                        }}>
                          {entry.latencyMs}ms
                        </span>
                      )}
                    </div>
                    {!isUser && (
                      <button
                        onClick={() => speak(entry.text, settings.audioVolume)}
                        className="extruded-btn p-1.5 rounded-md cursor-pointer hover:scale-105 transition-transform"
                        title="Replay voice line"
                      >
                        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>
                          volume_up
                        </span>
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-body)' }}>
                    {entry.text}
                  </p>
                  {entry.toolResults && entry.toolResults.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-1.5">
                      {entry.toolResults.map((tr, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs font-mono p-1.5 rounded"
                          style={{
                            background: tr.success ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 23, 68, 0.08)',
                            borderLeft: tr.success ? '3px solid #00e676' : '3px solid #ff1744',
                            color: tr.success ? '#69f0ae' : '#ff5252'
                          }}
                        >
                          <span className="font-bold">{tr.success ? '✓ SUCCESS:' : '✗ FAILURE:'}</span>
                          <span>{tr.message}</span>
                          {tr.error && <span className="opacity-85 text-[0.7rem]">({tr.error})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
