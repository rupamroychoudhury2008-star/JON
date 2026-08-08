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
    <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-y-auto animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-lg font-bold tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 8px var(--accent-glow, rgba(0,219,231,0.4))' }}
          >
            CONNECTIVITY & UPLINK
          </h2>
          <p className="tech-label mt-1">TELEMETRY NETWORK & HARDWARE STATUS</p>
        </div>
        <button
          onClick={runLatencyTest}
          disabled={isTesting}
          className="extruded-btn px-5 py-2.5 rounded-lg text-xs font-bold tracking-[0.12em] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-color, var(--color-cyan-dim))',
            borderColor: 'var(--color-cyan-border, rgba(0,219,231,0.25))',
          }}
        >
          {isTesting ? (
            <>
              <span className="material-symbols-outlined text-base animate-[spin_1s_linear_infinite]">sync</span>
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
        <div className="recessed-tray rounded-lg p-3.5 animate-[slide-up_0.3s_var(--ease-out-expo)]" style={{ background: 'rgba(0,219,231,0.06)' }}>
          <p className="text-xs font-mono" style={{ color: 'var(--accent-fix, var(--color-cyan-fix))' }}>
            ✓ {testLog}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="recessed-tray rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-lg" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>router</span>
            <span className="tech-label" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>PRIMARY GATEWAY</span>
          </div>
          <p
            className="text-xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-fix, var(--color-cyan-fix))', textShadow: '0 0 6px var(--accent-glow, rgba(0,219,231,0.4))' }}
          >
            {gatewayIp}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-tech-border)]">
            <span className="tech-label">LATENCY PING:</span>
            <span className="text-xs font-mono font-bold text-[#00e676]">{pingLatency} ms</span>
          </div>
        </div>

        <div className="recessed-tray rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-lg" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>cell_tower</span>
            <span className="tech-label" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>SATELLITE UPLINK</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <p className="text-sm font-bold tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: '#00e676' }}>
              ACTIVE / STABLE
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-tech-border)]">
            <span className="tech-label">FREQ: {uplinkFreq}</span>
            <span className="text-xs font-mono font-bold text-[var(--accent-fix)]">SNR: {uplinkSnr} dB</span>
          </div>
        </div>

        <div className="recessed-tray rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-lg" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>shield_lock</span>
            <span className="tech-label" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>SECURITY ENCRYPTION</span>
          </div>
          <p className="text-sm font-bold tracking-wider mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-fix)' }}>
            AES-256-GCM / OMEGA-7
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-tech-border)]">
            <span className="tech-label">KEY ROTATION:</span>
            <span className="text-xs font-mono font-bold text-[#ffba20]">60s INTERVAL</span>
          </div>
        </div>
      </div>

      <div>
        <p className="tech-label mb-3" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>HARDWARE INTERFACE SUBSYSTEMS</p>
        <div className="space-y-3">
          {HARDWARE_ROWS.map(row => (
            <div key={row.name} className="recessed-tray rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl" style={{ color: 'var(--accent-color, var(--color-cyan-dim))' }}>
                  {row.icon}
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                    {row.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                    {row.type} — {row.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="status-pill text-[0.6rem]" style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', borderColor: 'rgba(0,230,118,0.3)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00e676]" />
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
