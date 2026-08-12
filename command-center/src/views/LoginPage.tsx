import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login, colorMode, toggleColorMode } = useApp();
  const [username, setUsername] = useState('Operator-7');
  const [passcode, setPasscode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter an Operator ID');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await login(username.trim(), passcode.trim(), rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    await login('Chief Operator', 'omega-7', true);
    setIsLoading(false);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[var(--color-obsidian-bg)] text-[var(--color-text-primary)] font-sans antialiased p-6 relative overflow-hidden">
      {/* Background Radial Ambiance */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-[var(--color-cyan-glow)] blur-[120px]" />
      </div>

      {/* Spacious Minimalist Login Card Frame */}
      <div className="relative w-full max-w-lg obsidian-chassis rounded-3xl p-8 md:p-12 shadow-2xl border border-[var(--color-tech-border-strong)] backdrop-blur-2xl z-10 transition-all duration-300">
        
        {/* Header: Logo, Title & Theme Switcher */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--color-tech-border)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-obsidian-layer-1)] border border-[var(--color-cyan-border-bright)] flex items-center justify-center text-[var(--accent-fix)] shadow-[0_0_16px_var(--color-cyan-glow)]">
              <span className="material-symbols-outlined text-2xl">hexagon</span>
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-wider text-[var(--accent-fix)]">
                Jon AI
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">
                Sign in to your dashboard
              </p>
            </div>
          </div>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleColorMode}
            className="w-10 h-10 rounded-xl border border-[var(--color-tech-border-strong)] bg-[var(--color-obsidian-layer-1)] text-[var(--color-text-secondary)] hover:text-[var(--accent-fix)] hover:border-[var(--accent-fix)] transition-all flex items-center justify-center cursor-pointer shadow-sm"
            title={colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-xl">
              {colorMode === 'dark' ? 'wb_sunny' : 'dark_mode'}
            </span>
          </button>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] mb-2">
              Operator ID
            </label>
            <div className="relative flex items-center recessed-input-box rounded-2xl px-4 py-3.5">
              <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)] mr-3 select-none">
                person
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter Operator ID"
                className="w-full bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] font-mono placeholder-[var(--color-text-muted)]"
                required
              />
            </div>
          </div>

          {/* Passcode Input */}
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] mb-2">
              Passcode
            </label>
            <div className="relative flex items-center recessed-input-box rounded-2xl px-4 py-3.5">
              <span className="material-symbols-outlined text-lg text-[var(--color-text-muted)] mr-3 select-none">
                lock
              </span>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className="w-full bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] font-mono placeholder-[var(--color-text-muted)]"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors ml-2 p-1 cursor-pointer select-none"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPasscode ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text-secondary)] select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-tech-border-strong)] accent-[var(--accent-fix)] cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            {/* Quick Demo Access Link */}
            <button
              type="button"
              onClick={handleQuickLogin}
              className="text-[var(--accent-fix)] hover:underline cursor-pointer"
            >
              Demo Login
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bezel-button py-4 rounded-2xl font-mono text-sm font-bold text-[var(--accent-fix)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-[var(--accent-fix)] border-t-transparent animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">login</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
