import { useState, useRef, useEffect } from 'react';
import { useApp, type SessionEntry } from '../context/AppContext';
import { useWebSpeech } from '../hooks/useWebSpeech';
import ToolExecutionCard from '../components/ToolExecutionCard';

export default function SessionHistoryView() {
  const { sessionHistory, clearHistory, settings } = useApp();
  const { speak } = useWebSpeech();
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filtered = searchQuery
    ? sessionHistory.filter(e => e.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessionHistory;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(sessionHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jon-mission-transcript-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Smart Auto-Scroll Behavior
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
      setShowScrollDownBtn(false);
    } else {
      setShowScrollDownBtn(true);
    }
  }, [sessionHistory]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollDownBtn(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
      setShowScrollDownBtn(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-4 md:p-6 gap-4 animate-[fade-in_0.3s_ease-out] relative">
      {/* View Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h2
            className="text-lg font-bold tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
          >
            COMMAND STREAM & SESSION TRANSCRIPT
          </h2>
          <p className="tech-label mt-1">{sessionHistory.length} DIALOGUE TURNS RECORDED • MISSION EVENT LOG</p>
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
            CLEAR STREAM
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="recessed-tray rounded-lg p-0.5 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter command stream by keyword..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-mono"
          />
        </div>
      </div>

      {/* Event Stream List (Internal Scroll Container) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 relative"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-text-muted)] py-16 recessed-tray rounded-lg">
            <span className="material-symbols-outlined text-5xl opacity-40">rss_feed</span>
            <p className="text-sm font-medium font-mono">No transcript events recorded.</p>
            <p className="text-xs text-[var(--color-text-muted)]">Issue a voice command or text query in JON Core.</p>
          </div>
        ) : (
          filtered.map((entry: SessionEntry) => {
            const isUser = entry.role === 'user';
            return (
              <div key={entry.id} className="flex flex-col gap-2">
                {/* User / Assistant Event Block */}
                <div
                  className="recessed-tray rounded-lg p-4 w-full animate-[fade-in_0.2s_ease-out]"
                  style={{
                    borderLeft: isUser ? '3px solid #ffba20' : '3px solid var(--accent-color, var(--color-cyan-dim))',
                    background: isUser ? 'rgba(12,15,18,0.85)' : 'rgba(8,10,12,0.95)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: isUser ? '#ffba20' : 'var(--accent-color)' }}
                      >
                        {isUser ? 'person' : 'token'}
                      </span>
                      <span
                        className="tech-label font-bold text-xs"
                        style={{ color: isUser ? '#ffba20' : 'var(--accent-fix)' }}
                      >
                        {isUser ? 'OPERATOR COMMAND' : 'JON AI'}
                      </span>
                      <span className="tech-label text-[0.55rem]">{formatTime(entry.timestamp)}</span>

                      {entry.latencyMs !== undefined && (
                        <span className="status-pill text-[0.55rem] py-0.5 px-2 bg-[var(--color-cyan-subtle)] text-[var(--accent-fix)]">
                          {entry.latencyMs}ms
                        </span>
                      )}
                    </div>

                    {!isUser && (
                      <button
                        onClick={() => speak(entry.text, settings.audioVolume)}
                        className="extruded-btn p-1.5 rounded-md cursor-pointer hover:scale-105 transition-transform"
                        title="Replay voice response"
                      >
                        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-color)' }}>
                          volume_up
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Body Text / Code Block Formatting */}
                  <div className="text-sm leading-relaxed text-[var(--color-text-primary)] font-sans whitespace-pre-wrap max-h-96 overflow-y-auto pr-1">
                    {entry.text}
                  </div>

                  {/* Dedicated Embedded Tool Execution Cards */}
                  {entry.toolResults && entry.toolResults.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[var(--color-tech-border)] space-y-2">
                      <p className="tech-label text-[0.55rem] mb-1">ASSOCIATED TOOL ACTIONS ({entry.toolResults.length})</p>
                      {entry.toolResults.map((tr, idx) => (
                        <ToolExecutionCard key={idx} tool={tr} latencyMs={entry.latencyMs} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating New Response Scroll Down Button */}
      {showScrollDownBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-8 z-20 tactile-press-btn px-3 py-1.5 rounded-full text-[0.62rem] font-mono font-bold text-[var(--accent-fix)] border border-[var(--color-cyan-border)] flex items-center gap-1.5 shadow-lg animate-bounce"
        >
          <span className="material-symbols-outlined text-sm">arrow_downward</span>
          NEW RESPONSE ↓
        </button>
      )}
    </div>
  );
}
