import { useEffect, useState } from 'react';
import { useApp, type VaultNote } from '../context/AppContext';

export default function MemoryView() {
  const { notes, isLoadingNotes, fetchNotes, promoteMemory } = useApp();
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<VaultNote | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoResult, setPromoResult] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = search
    ? notes.filter(n =>
        n.path.toLowerCase().includes(search.toLowerCase()) ||
        n.snippet.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const handlePromote = async () => {
    setIsPromoting(true);
    setPromoResult(null);
    const res = await promoteMemory();
    setPromoResult(res.message);
    setIsPromoting(false);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-5 overflow-y-auto animate-[fade-in_0.3s_ease-out]">
      {/* View Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-lg font-bold tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
          >
            OBSIDIAN VAULT MEMORY
          </h2>
          <p className="tech-label mt-1">REAL OBSIDIAN NOTES • SHORT-TERM & LONG-TERM MEMORY VAULTS • {notes.length} INDEXED</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotes}
            disabled={isLoadingNotes}
            className="extruded-btn px-3 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color, var(--color-cyan-dim))' }}
          >
            <span className={`material-symbols-outlined text-sm ${isLoadingNotes ? 'animate-spin' : ''}`}>sync</span>
            SYNC VAULT
          </button>

          <button
            onClick={handlePromote}
            disabled={isPromoting}
            className="extruded-btn px-4 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 219, 231, 0.1)',
              color: 'var(--accent-fix, var(--color-cyan-fix))',
              borderColor: 'var(--color-cyan-border)',
            }}
            title="Promote ShortTerm interactions into LongTerm memory vault"
          >
            <span className={`material-symbols-outlined text-sm ${isPromoting ? 'animate-spin' : ''}`}>psychology</span>
            PROMOTE MEMORY
          </button>
        </div>
      </div>

      {promoResult && (
        <div className="recessed-tray rounded-lg p-3 animate-[slide-up_0.3s_ease-out]" style={{ background: 'rgba(0, 230, 118, 0.08)' }}>
          <p className="text-xs font-mono text-[#00e676]">✓ {promoResult}</p>
        </div>
      )}

      {/* Search Input */}
      <div className="recessed-tray rounded-lg p-0.5">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)]">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Obsidian Vault notes by path, tags, or content..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-mono"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {isLoadingNotes && notes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
            <span className="material-symbols-outlined text-4xl animate-spin mb-2 text-[var(--accent-color)]">sync</span>
            <p className="text-xs font-mono">Indexing Obsidian Vault notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-40">folder_open</span>
            <p className="text-xs font-mono">No memory notes found matching search query.</p>
          </div>
        ) : (
          filteredNotes.map((note, idx) => {
            const isShortTerm = note.path.toLowerCase().includes('shortterm');
            const isLongTerm = note.path.toLowerCase().includes('longterm');

            return (
              <div
                key={idx}
                onClick={() => setSelectedNote(note)}
                className="recessed-tray rounded-lg p-4 cursor-pointer hover:border-[var(--color-cyan-border)] transition-all duration-200 flex flex-col justify-between group"
                style={{
                  borderLeft: `3px solid ${isShortTerm ? '#ffba20' : isLongTerm ? '#00e676' : 'var(--accent-color)'}`,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-color)' }}>
                      description
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[0.55rem] font-bold font-mono tracking-wider"
                      style={{
                        background: isShortTerm ? 'rgba(255, 186, 32, 0.1)' : isLongTerm ? 'rgba(0, 230, 118, 0.1)' : 'rgba(0, 219, 231, 0.1)',
                        color: isShortTerm ? '#ffba20' : isLongTerm ? '#00e676' : 'var(--accent-fix)',
                        border: `1px solid ${isShortTerm ? 'rgba(255,186,32,0.3)' : isLongTerm ? 'rgba(0,230,118,0.3)' : 'rgba(0,219,231,0.3)'}`,
                      }}
                    >
                      {isShortTerm ? 'SHORT-TERM' : isLongTerm ? 'LONG-TERM' : 'VAULT NOTE'}
                    </span>
                  </div>

                  <p className="text-xs font-bold font-mono text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--accent-fix)] transition-colors truncate" title={note.path}>
                    {note.path}
                  </p>

                  <p className="text-[0.72rem] leading-relaxed text-[var(--color-text-secondary)] font-mono line-clamp-4">
                    {note.snippet || 'No snippet available.'}
                  </p>
                </div>

                {note.frontmatter && Object.keys(note.frontmatter).length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[var(--color-tech-border)] flex items-center gap-1.5 flex-wrap">
                    {Object.entries(note.frontmatter).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="text-[0.55rem] font-mono px-1.5 py-0.5 rounded bg-[var(--color-obsidian-bg)] text-[var(--color-text-muted)] border border-[var(--color-tech-border)]">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Note Detail Inspector Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="obsidian-panel rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col p-5 animate-[fade-in_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-tech-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[var(--accent-color)]">description</span>
                <h3 className="text-sm font-bold font-mono text-[var(--accent-fix)]">{selectedNote.path}</h3>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs text-[var(--color-text-primary)] leading-relaxed space-y-3 pr-2">
              {selectedNote.frontmatter && Object.keys(selectedNote.frontmatter).length > 0 && (
                <div className="p-3 rounded bg-[var(--color-obsidian-bg)] border border-[var(--color-tech-border)] space-y-1">
                  <p className="tech-label text-[0.55rem] mb-1">FRONTMATTER METADATA</p>
                  <pre className="text-[0.68rem] text-[var(--accent-fix)]">{JSON.stringify(selectedNote.frontmatter, null, 2)}</pre>
                </div>
              )}

              <div className="p-3 rounded bg-[var(--color-obsidian-layer-1)] border border-[var(--color-tech-border)]">
                <p className="tech-label text-[0.55rem] mb-2">NOTE CONTENT SNIPPET</p>
                <div className="whitespace-pre-wrap">{selectedNote.snippet}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
