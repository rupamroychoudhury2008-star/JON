import CommandBar from './CommandBar';

export default function CommandDock() {
  return (
    <footer className="w-full flex-shrink-0 z-30 p-3 md:p-4 border-t-2 border-[rgba(0,219,231,0.2)] bg-[#040608] shadow-[inset_0_2px_10px_rgba(0,0,0,0.9),0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <CommandBar />
      </div>
    </footer>
  );
}
