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
    <div className="flex flex-col h-full min-h-0 p-4 md:p-6 gap-4 animate-fadeIn relative">
      {/* View Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 flex-shrink-0 border-b border-[rgba(0,219,231,0.15)] pb-4">
        <div>
          <h2
            className="text-lg font-extrabold tracking-[0.1em] text-[var(--color-cyan-fix)] text-shadow-[0_0_10px_var(--color-cyan-glow)] font-mono"
          >
            COMMAND STREAM & SESSION TRANSCRIPT
          </h2>
          <p className="tech-label mt-1 text-[var(--color-text-muted)]">{sessionHistory.length} DIALOGUE TURNS RECORDED • MISSION EVENT LOG</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={exportJSON}
            disabled={sessionHistory.length === 0}
            className="extruded-btn px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-cyan-fix)] border-[rgba(0,219,231,0.3)] hover:border-[var(--color-cyan-fix)] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            EXPORT JSON
          </button>

          <button
            onClick={clearHistory}
            disabled={sessionHistory.length === 0}
            className="extruded-btn px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-red-400 bg-red-950/30 border-red-500/30 hover:bg-red-900/40 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            CLEAR STREAM
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="recessed-tray rounded-xl p-0.5 flex-shrink-0 border border-[rgba(0,219,231,0.2)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
        <div className="flex items-center gap-2 px-3.5 py-2">
          <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter command stream by keyword..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] font-mono"
          />
        </div>
      </div>

      {/* Event Stream List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 relative"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-text-muted)] py-16 recessed-tray rounded-2xl border border-[rgba(255,255,255,0.06)]">
            <span className="material-symbols-outlined text-5xl opacity-40 text-[var(--color-cyan-fix)]">rss_feed</span>
            <p className="text-sm font-semibold font-mono">No transcript events recorded.</p>
            <p className="text-xs text-[var(--color-text-muted)]">Issue a voice command or text query in JON Core.</p>
          </div>
        ) : (
          filtered.map((entry: SessionEntry) => {
            const isUser = entry.role === 'user';
            return (
              <div key={entry.id} className="flex flex-col gap-2">
                {/* User / Assistant Event Block */}
                <div
                  className="recessed-tray rounded-2xl p-4.5 w-full animate-slide-up transition-all border shadow-lg"
                  style={{
                    borderLeft: isUser ? '4px solid #f59e0b' : '4px solid var(--color-cyan-fix)',
                    borderColor: isUser ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 219, 231, 0.25)',
                    background: isUser ? 'rgba(15, 23, 42, 0.75)' : 'rgba(9, 13, 20, 0.85)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: isUser ? '#f59e0b' : 'var(--color-cyan-fix)' }}
                      >
                        {isUser ? 'person' : 'token'}
                      </span>
                      <span
                        className="tech-label font-bold text-xs"
                        style={{ color: isUser ? '#f59e0b' : 'var(--color-cyan-fix)' }}
                      >
                        {isUser ? 'OPERATOR COMMAND' : 'JON AI'}
                      </span>
                      <span className="tech-label text-[0.58rem]">{formatTime(entry.timestamp)}</span>

                      {entry.latencyMs !== undefined && (
                        <span className="status-pill-cyan text-[0.55rem] py-0.5 px-2.5">
                          {entry.latencyMs}ms
                        </span>
                      )}
                    </div>

                    {!isUser && (
                      <button
                        onClick={() => speak(entry.text, settings.audioVolume)}
                        className="extruded-btn p-1.5 rounded-lg cursor-pointer hover:scale-110 transition-transform text-[var(--color-cyan-fix)] border-[rgba(0,219,231,0.3)]"
                        title="Replay voice response"
                      >
                        <span className="material-symbols-outlined text-sm">
                          volume_up
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="text-xs leading-relaxed text-[var(--color-text-primary)] font-sans whitespace-pre-wrap max-h-96 overflow-y-auto pr-1 selection:bg-[rgba(0,219,231,0.3)]">
                    {entry.text}
                  </div>

                  {/* Dedicated Embedded Tool Execution Cards */}
                  {entry.toolResults && entry.toolResults.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-[var(--color-tech-border)] space-y-2">
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
          className="absolute bottom-6 right-8 z-20 px-4 py-2 rounded-full text-[0.62rem] font-mono font-extrabold text-[var(--color-cyan-fix)] bg-[rgba(9,13,20,0.9)] backdrop-blur-md border border-[var(--color-cyan-fix)] flex items-center gap-2 shadow-[0_0_16px_var(--color-cyan-glow)] animate-bounce cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_downward</span>
          NEW RESPONSE ↓
        </button>
      )}
    </div>
  );
}
