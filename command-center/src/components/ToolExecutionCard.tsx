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
      className="recessed-tray rounded-lg p-3.5 my-2 border-l-4 transition-all duration-200"
      style={{
        borderLeftColor: isSuccess ? '#00e676' : '#ff5252',
        background: 'var(--color-obsidian-layer-1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header Line */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color: isSuccess ? '#00e676' : '#ff5252' }}>
            {isSuccess ? 'terminal' : 'error'}
          </span>
          <span className="tech-label font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>
            TOOL EXECUTION
          </span>
          <span
            className="px-2 py-0.5 rounded text-[0.6rem] font-bold font-mono tracking-wider"
            style={{
              background: isSuccess ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 82, 82, 0.12)',
              color: isSuccess ? '#74f5ff' : '#fca5a5',
              border: `1px solid ${isSuccess ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 82, 82, 0.25)'}`,
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
              background: isSuccess ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
              color: isSuccess ? '#00e676' : '#ff5252',
              borderColor: isSuccess ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 82, 82, 0.3)',
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
          <span className="text-[var(--accent-fix)] font-semibold">{target}</span>
        </div>
      )}

      {/* Execution Result Message */}
      <p className="text-xs leading-relaxed text-[var(--color-text-primary)] font-mono">
        {tool.message}
      </p>

      {/* Error Output if present */}
      {tool.error && (
        <div className="mt-2 p-2 rounded bg-[#2a0c0e] border border-[#ff5252]/30 text-[#fca5a5] text-[0.68rem] font-mono">
          <span className="font-bold">ERROR DETAILS: </span>
          {tool.error}
        </div>
      )}

      {/* Structured data payload if present */}
      {tool.data && Object.keys(tool.data).length > 0 && (
        <pre className="mt-2 p-2 rounded bg-[var(--color-obsidian-bg)] border border-[var(--color-tech-border)] text-[var(--color-cyan-fix)] text-[0.65rem] font-mono overflow-x-auto">
          {JSON.stringify(tool.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
