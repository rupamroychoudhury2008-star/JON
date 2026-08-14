import type { ToolResultEntry } from '../context/AppContext';

interface ToolExecutionCardProps {
  tool: ToolResultEntry;
  latencyMs?: number;
}

export default function ToolExecutionCard({ tool, latencyMs }: ToolExecutionCardProps) {
  const isSuccess = tool.success;
  const toolName = (tool.tool_name || tool.action || 'DEVICE_TOOL').toUpperCase();
  const target = tool.target || (tool.data ? JSON.stringify(tool.data) : undefined);

  return (
    <div
      className="recessed-tray rounded-xl p-3.5 my-2 border-l-4 transition-all duration-200 shadow-md"
      style={{
        borderLeftColor: isSuccess ? '#10b981' : '#ef4444',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header Line */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ color: isSuccess ? '#10b981' : '#ef4444' }}>
            {isSuccess ? 'terminal' : 'error'}
          </span>
          <span className="tech-label font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>
            TOOL EXECUTION
          </span>
          <span
            className="px-2 py-0.5 rounded text-[0.6rem] font-bold font-mono tracking-wider"
            style={{
              background: isSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isSuccess ? 'var(--color-cyan-fix)' : '#fca5a5',
              border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            {toolName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {latencyMs !== undefined && (
            <span className="text-[0.6rem] font-mono text-[var(--color-text-muted)]">
              {latencyMs}ms
            </span>
          )}
          <span
            className="status-pill text-[0.55rem] py-0.5 px-2 font-mono font-bold"
            style={{
              background: isSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isSuccess ? '#10b981' : '#ef4444',
              borderColor: isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            }}
          >
            {isSuccess ? '● COMPLETED' : '● FAILED'}
          </span>
        </div>
      </div>

      {/* Target Details */}
      {target && (
        <div className="text-[0.68rem] font-mono text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-1.5">
          <span className="text-[var(--color-text-muted)]">Target:</span>
          <span className="text-[var(--color-cyan-fix)] font-semibold">{target}</span>
        </div>
      )}

      {/* Execution Result Message */}
      <p className="text-xs leading-relaxed text-[var(--color-text-primary)] font-mono">
        {tool.message}
      </p>

      {/* Error Output if present */}
      {tool.error && (
        <div className="mt-2 p-2.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-[0.68rem] font-mono">
          <span className="font-bold">ERROR DETAILS: </span>
          {tool.error}
        </div>
      )}

      {/* Structured data payload if present */}
      {tool.data && Object.keys(tool.data).length > 0 && (
        <pre className="mt-2 p-2.5 rounded-lg bg-[rgba(9,13,20,0.8)] border border-[rgba(255,255,255,0.08)] text-[var(--color-cyan-fix)] text-[0.65rem] font-mono overflow-x-auto">
          {JSON.stringify(tool.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
