import CommandBar from './CommandBar';

export default function CommandDock() {
  return (
    <footer className="w-full flex-shrink-0 z-30 p-3 md:p-4 border-t border-[var(--color-cyan-border)] bg-[rgba(9,13,20,0.85)] backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <CommandBar />
      </div>
    </footer>
  );
}
