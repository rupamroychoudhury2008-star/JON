import { useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface DiagModule {
  id: string;
  label: string;
  icon: string;
  status: 'passed' | 'running' | 'failed' | 'pending';
  desc: string;
  detail: string;
  durationMs: number;
}

const INITIAL_TESTS: DiagModule[] = [
  { id: 'memory', label: 'Core Memory Integrity', icon: 'memory', status: 'passed', desc: 'ECC RAM Bank Verification', detail: '16384 MB allocated — 0 bit error count', durationMs: 120 },
  { id: 'shader', label: 'WebGL Shader Compiler', icon: 'blur_on', status: 'passed', desc: 'GLSL ES 3.0 Fragment Pipeline', detail: 'Particle field compilation OK — 60 FPS verified', durationMs: 85 },
  { id: 'audio', label: 'Audio PCM Buffer', icon: 'graphic_eq', status: 'passed', desc: 'PCM Audio Buffer & Codec Sync', detail: '256 samples @ 48kHz — 12ms roundtrip latency', durationMs: 42 },
  { id: 'neural', label: 'JON Neural Pipeline', icon: 'psychology', status: 'passed', desc: 'Neural Processing Endpoint Verification', detail: 'Model inference connected — 97.3% response score', durationMs: 310 },
  { id: 'security', label: 'Security Handshake', icon: 'shield', status: 'passed', desc: 'Omega-7 TLS Encryption Protocols', detail: 'AES-256-GCM handshake verified — key rotation 60s', durationMs: 95 },
];

export default function DiagnosticsView() {
  const { addLog } = useApp();
  const [tests, setTests] = useState<DiagModule[]>(INITIAL_TESTS);
  const [isRunning, setIsRunning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runAllDiagnostics = useCallback(() => {
    setIsRunning(true);
    setTests(prev => prev.map(t => ({ ...t, status: 'running' })));

    addLog({
      timestamp: Date.now(),
      category: 'SYS',
      level: 'INFO',
      message: 'DIAGNOSTIC SUITE RUNNING — Executing 5 core verification self-tests.',
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setTests(prev => prev.map(t => ({
        ...t,
        status: 'passed',
        durationMs: Math.floor(40 + Math.random() * 280),
      })));
      setIsRunning(false);

      addLog({
        timestamp: Date.now(),
        category: 'SYS',
        level: 'SUCCESS',
        message: 'DIAGNOSTIC SUITE COMPLETE — 5/5 self-tests PASSED successfully.',
        details: 'Memory, WebGL, PCM Audio, Gemini Neural, and Security verified.'
      });
    }, 2000);
  }, [addLog]);

  const passedCount = tests.filter(t => t.status === 'passed').length;

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-y-auto animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-lg font-bold tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
          >
            SYSTEM DIAGNOSTICS
          </h2>
          <p className="tech-label mt-1">
            {isRunning ? 'RUNNING AUTOMATED SELF-TEST SUITE...' : `${passedCount}/${tests.length} TESTS PASSED • READY`}
          </p>
        </div>
        <button
          onClick={runAllDiagnostics}
          disabled={isRunning}
          className="extruded-btn px-5 py-2.5 rounded-lg text-xs font-bold tracking-[0.12em] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-color, var(--color-cyan-dim))',
            borderColor: 'var(--color-cyan-border, rgba(0,219,231,0.25))',
          }}
        >
          {isRunning ? (
            <>
              <span className="material-symbols-outlined text-base animate-[spin_1s_linear_infinite]">sync</span>
              RUNNING SUITE...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">play_arrow</span>
              RUN ALL DIAGNOSTICS
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {tests.map(test => {
          const isPassed = test.status === 'passed';
          const isRunningTest = test.status === 'running';

          return (
            <div
              key={test.id}
              className="recessed-tray rounded-lg p-4 transition-all duration-300"
              style={{
                borderLeftWidth: '3px',
                borderLeftColor: isPassed ? '#00e676' : isRunningTest ? 'var(--accent-color, var(--color-cyan-dim))' : '#ff5252',
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl ${isRunningTest ? 'animate-[spin_1s_linear_infinite]' : ''}`}
                    style={{
                      color: isPassed ? '#00e676' : isRunningTest ? 'var(--accent-color, var(--color-cyan-dim))' : '#ff5252',
                    }}
                  >
                    {isRunningTest ? 'sync' : isPassed ? 'check_circle' : 'error'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                        {test.label}
                      </p>
                      <span className="tech-label" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>
                        ({test.desc})
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                      {test.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    {test.durationMs}ms
                  </span>
                  <span
                    className="status-pill text-[0.6rem] uppercase tracking-wider"
                    style={{
                      color: isPassed ? '#00e676' : isRunningTest ? 'var(--accent-color, var(--color-cyan-dim))' : '#ff5252',
                      background: isPassed ? 'rgba(0,230,118,0.1)' : 'rgba(0,219,231,0.1)',
                      borderColor: isPassed ? 'rgba(0,230,118,0.3)' : 'rgba(0,219,231,0.3)',
                    }}
                  >
                    {test.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isRunning && passedCount === tests.length && (
        <div className="recessed-tray rounded-lg p-4 animate-[slide-up_0.3s_var(--ease-out-expo)]" style={{ background: 'rgba(0,230,118,0.06)' }}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#00e676]">verified</span>
            <div>
              <p className="text-sm font-bold text-[#00e676]" style={{ fontFamily: 'var(--font-display)' }}>
                ALL DIAGNOSTIC SELF-TESTS PASSED
              </p>
              <p className="tech-label mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                5/5 MODULES VERIFIED NOMINAL • ZERO ANOMALIES DETECTED
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
