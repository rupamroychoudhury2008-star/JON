interface StatusLedProps {
  status: 'cyan' | 'green' | 'amber' | 'red' | 'off';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function StatusLed({ status, pulse = false, size = 'md', label }: StatusLedProps) {
  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const ledClasses = {
    cyan: 'led-dot-cyan',
    green: 'led-dot-green',
    amber: 'led-dot-amber',
    red: 'led-dot-red',
    off: 'bg-slate-700 border-slate-900',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`led-dot ${sizeMap[size]} ${ledClasses[status]} ${pulse ? 'animate-pulse' : ''}`}
      />
      {label && <span className="engraved-label text-[0.55rem]">{label}</span>}
    </div>
  );
}
