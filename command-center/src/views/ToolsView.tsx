import { useApp } from '../context/AppContext';
import ToolExecutionCard from '../components/ToolExecutionCard';

export default function ToolsView() {
  const { allExecutedTools, processCommand } = useApp();

  const handleQuickTool = (cmd: string) => {
    processCommand(cmd);
  };

  const totalExecuted = allExecutedTools.length;
  const successCount = allExecutedTools.filter(t => t.success).length;
  const failureCount = totalExecuted - successCount;
  const successRate = totalExecuted > 0 ? Math.round((successCount / totalExecuted) * 100) : 100;

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-5 overflow-y-auto animate-[fade-in_0.3s_ease-out]">
      {/* View Header */}
      <div>
        <h2
          className="text-lg font-bold tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
        >
          TOOL EXECUTION MONITOR
        </h2>
        <p className="tech-label mt-1">DEVICE AUTOMATION & APPLICATION ORCHESTRATION TELEMETRY</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="recessed-tray rounded-lg p-3.5">
          <p className="tech-label text-[0.55rem] mb-1">TOTAL EXECUTIONS</p>
          <p className="text-xl font-bold font-mono text-[var(--accent-fix)]">{totalExecuted}</p>
        </div>
        <div className="recessed-tray rounded-lg p-3.5">
          <p className="tech-label text-[0.55rem] mb-1">SUCCESS RATE</p>
          <p className="text-xl font-bold font-mono text-[#00e676]">{successRate}%</p>
        </div>
        <div className="recessed-tray rounded-lg p-3.5">
          <p className="tech-label text-[0.55rem] mb-1">SUCCESSFUL RUNS</p>
          <p className="text-xl font-bold font-mono text-[#00e676]">{successCount}</p>
        </div>
        <div className="recessed-tray rounded-lg p-3.5">
          <p className="tech-label text-[0.55rem] mb-1">FAILED RUNS</p>
          <p className="text-xl font-bold font-mono text-[#ff5252]">{failureCount}</p>
        </div>
      </div>

      {/* Quick Launch Tool Actions */}
      <div>
        <p className="tech-label mb-2" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>QUICK DESKTOP AUTOMATIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Launch Chrome', cmd: 'open chrome' },
            { label: 'Launch Notepad', cmd: 'open notepad' },
            { label: 'Launch Calculator', cmd: 'open calc' },
            { label: 'Type Text Test', cmd: 'type hello world' },
            { label: 'Sync Vault Notes', cmd: 'read notes' },
          ].map(action => (
            <button
              key={action.cmd}
              onClick={() => handleQuickTool(action.cmd)}
              className="extruded-btn px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer hover:border-[var(--color-cyan-border)] transition-colors"
            >
              <span className="material-symbols-outlined text-xs text-[var(--accent-color)]">play_arrow</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Executed Tools Stream */}
      <div className="flex-1 flex flex-col min-h-0">
        <p className="tech-label mb-2" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>RECENT TOOL EXECUTION LOGS</p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {allExecutedTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 recessed-tray rounded-lg text-[var(--color-text-muted)]">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-40">terminal</span>
              <p className="text-xs font-mono">No tool executions recorded in current session.</p>
              <p className="text-[0.65rem] mt-1 text-[var(--color-text-muted)]">Issue a command like "open chrome" or "open notepad" to see live execution telemetry.</p>
            </div>
          ) : (
            allExecutedTools.map((tool, idx) => (
              <ToolExecutionCard key={idx} tool={tool} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
