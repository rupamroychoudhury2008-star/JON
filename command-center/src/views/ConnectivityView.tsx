import { useState, useCallback } from 'react';

interface HardwareRow {
  name: string;
  type: string;
  status: 'CONNECTED' | 'SYNCED';
  detail: string;
  icon: string;
}

const HARDWARE_ROWS: HardwareRow[] = [
  { name: 'Ethernet eth0', type: 'Physical 10Gbit RJ45', status: 'CONNECTED', detail: 'IP: 10.0.1.42 — MTU: 9000 — Duplex: Full', icon: 'settings_ethernet' },
  { name: 'Wi-Fi 7 wlan0', type: 'Wireless 802.11be (6GHz)', status: 'CONNECTED', detail: 'SSID: ORBITAL-SEC — Ch 149 — Signal: -48 dBm', icon: 'wifi' },
  { name: 'Orbital Transceiver sat0', type: 'Ka-Band Satellite Array', status: 'SYNCED', detail: 'Freq: 28.5 GHz — SNR: 34.2 dB — Elevation: 42.7°', icon: 'cell_tower' },
];

export default function ConnectivityView() {
  const [gatewayIp] = useState('10.0.1.42');
  const [pingLatency, setPingLatency] = useState(12.4);
  const uplinkFreq = '28.5 GHz';
  const [uplinkSnr, setUplinkSnr] = useState(34.2);
  const [isTesting, setIsTesting] = useState(false);
  const [testLog, setTestLog] = useState<string | null>(null);

  const runLatencyTest = useCallback(() => {
    setIsTesting(true);
    setTestLog(null);
    const start = performance.now();

    setTimeout(() => {
      const newPing = +(8 + Math.random() * 10).toFixed(1);
      const newSnr = +(32 + Math.random() * 6).toFixed(1);
      const elapsed = Math.round(performance.now() - start);

      setPingLatency(newPing);
      setUplinkSnr(newSnr);
      setTestLog(`Latency test finished in ${elapsed}ms: Gateway Ping = ${newPing}ms | Orbital SNR = ${newSnr} dB | Jitter = 1.2ms`);
      setIsTesting(false);
    }, 1500);
  }, []);

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-y-auto animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[rgba(0,219,231,0.15)] pb-4">
        <div>
          <h2
            className="text-lg font-extrabold tracking-[0.1em] text-[var(--color-cyan-fix)] text-shadow-[0_0_10px_var(--color-cyan-glow)] font-mono"
          >
            CONNECTIVITY & TELEMETRY NETWORK
          </h2>
          <p className="tech-label mt-1 text-[var(--color-text-muted)]">SYSTEM HARDWARE INTERFACE & SATELLITE SUBSYSTEM STATUS</p>
        </div>
        <button
          onClick={runLatencyTest}
          disabled={isTesting}
          className="extruded-btn px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-[0.12em] flex items-center gap-2 cursor-pointer disabled:opacity-50 text-[var(--color-cyan-fix)] border-[rgba(0,219,231,0.35)] bg-[rgba(0,219,231,0.1)] hover:bg-[rgba(0,219,231,0.18)] transition-all shadow-[0_0_12px_rgba(0,219,231,0.2)]"
        >
          {isTesting ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">sync</span>
              TESTING LATENCY...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">speed</span>
              RUN LATENCY TEST
            </>
          )}
        </button>
      </div>

      {testLog && (
        <div className="recessed-tray rounded-2xl p-4 animate-slideUp border border-[rgba(0,219,231,0.3)] bg-[rgba(0,219,231,0.08)] backdrop-blur-md">
          <p className="text-xs font-mono text-[var(--color-cyan-fix)] font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {testLog}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.18)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-lg text-[var(--color-cyan-fix)]">router</span>
            <span className="tech-label text-[var(--color-cyan-fix)]">PRIMARY GATEWAY</span>
          </div>
          <p
            className="text-xl font-extrabold font-mono mb-1 text-[var(--color-cyan-fix)] text-shadow-[0_0_8px_var(--color-cyan-glow)]"
          >
            {gatewayIp}
          </p>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-tech-border)]">
            <span className="tech-label">LATENCY PING:</span>
            <span className="text-xs font-mono font-bold text-[#10b981]">{pingLatency} ms</span>
          </div>
        </div>

        <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.18)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-lg text-[var(--color-cyan-fix)]">cell_tower</span>
            <span className="tech-label text-[var(--color-cyan-fix)]">SATELLITE UPLINK</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse" />
            <p className="text-sm font-extrabold tracking-wider font-mono text-[#10b981]">
              ACTIVE / STABLE
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-tech-border)]">
            <span className="tech-label">FREQ: {uplinkFreq}</span>
            <span className="text-xs font-mono font-bold text-[var(--color-cyan-fix)]">SNR: {uplinkSnr} dB</span>
          </div>
        </div>

        <div className="recessed-tray rounded-2xl p-5 border border-[rgba(0,219,231,0.18)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-lg text-[var(--color-cyan-fix)]">shield_lock</span>
            <span className="tech-label text-[var(--color-cyan-fix)]">SECURITY ENCRYPTION</span>
          </div>
          <p className="text-sm font-extrabold tracking-wider font-mono mb-1 text-[var(--color-cyan-fix)]">
            AES-256-GCM / OMEGA-7
          </p>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-tech-border)]">
            <span className="tech-label">KEY ROTATION:</span>
            <span className="text-xs font-mono font-bold text-[#f59e0b]">60s INTERVAL</span>
          </div>
        </div>
      </div>

      <div>
        <p className="tech-label mb-3 text-[var(--color-cyan-fix)]">HARDWARE INTERFACE SUBSYSTEMS</p>
        <div className="space-y-3">
          {HARDWARE_ROWS.map(row => (
            <div key={row.name} className="recessed-tray rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 border border-[rgba(255,255,255,0.06)] bg-[rgba(15,23,42,0.5)] backdrop-blur-md hover:border-[rgba(0,219,231,0.25)] transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,219,231,0.08)] border border-[rgba(0,219,231,0.25)] flex items-center justify-center text-[var(--color-cyan-fix)]">
                  <span className="material-symbols-outlined text-xl">
                    {row.icon}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold font-mono text-[var(--color-text-primary)]">
                    {row.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                    {row.type} — {row.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="status-pill-green text-[0.6rem] py-1 px-3">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
