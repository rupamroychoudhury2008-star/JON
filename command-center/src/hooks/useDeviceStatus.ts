import { useState, useEffect } from 'react';

export interface DeviceStatus {
  // Battery
  batterySupported: boolean;
  batteryLevel: number; // 0 to 100
  isCharging: boolean;
  batteryIcon: string;
  batteryTooltip: string;
  batteryColor: string;

  // Network / Wi-Fi
  isOnline: boolean;
  networkType: string; // '4g', '3g', 'wifi', etc.
  downlinkMb: number | null; // Mbps
  rttMs: number | null; // ms
  wifiIcon: string;
  wifiTooltip: string;
  wifiColor: string;

  // Signal Strength
  signalBars: number; // 1 to 4
  signalIcon: string;
  signalTooltip: string;
  signalColor: string;
}

export function useDeviceStatus(): DeviceStatus {
  // Battery State
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [batterySupported, setBatterySupported] = useState<boolean>(false);

  // Network State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [networkType, setNetworkType] = useState<string>('4g');
  const [downlinkMb, setDownlinkMb] = useState<number | null>(null);
  const [rttMs, setRttMs] = useState<number | null>(null);

  // 1. Battery Listener
  useEffect(() => {
    let batteryObj: any = null;

    const updateBattery = (battery: any) => {
      const level = Math.round(battery.level * 100);
      setBatteryLevel(level);
      setIsCharging(battery.charging);
    };

    if ('getBattery' in navigator) {
      setBatterySupported(true);
      (navigator as any).getBattery().then((battery: any) => {
        batteryObj = battery;
        updateBattery(battery);

        const onLevelChange = () => updateBattery(battery);
        const onChargingChange = () => updateBattery(battery);

        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);
      }).catch(() => {
        setBatterySupported(false);
      });
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', () => {});
        batteryObj.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  // 2. Network Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateNetworkInfo = () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        setNetworkType(conn.effectiveType || conn.type || '4g');
        setDownlinkMb(conn.downlink || null);
        setRttMs(conn.rtt || null);
      }
    };

    updateNetworkInfo();
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  // Compute Battery Icon & Tooltip
  let batteryIcon = 'battery_full';
  let batteryColor = 'var(--accent-color, var(--color-cyan-dim))';
  if (isCharging) {
    if (batteryLevel >= 90) batteryIcon = 'battery_charging_full';
    else if (batteryLevel >= 70) batteryIcon = 'battery_charging_80';
    else if (batteryLevel >= 40) batteryIcon = 'battery_charging_50';
    else batteryIcon = 'battery_charging_20';
  } else {
    if (batteryLevel >= 90) batteryIcon = 'battery_full';
    else if (batteryLevel >= 60) batteryIcon = 'battery_5_bar';
    else if (batteryLevel >= 35) batteryIcon = 'battery_3_bar';
    else if (batteryLevel >= 15) {
      batteryIcon = 'battery_2_bar';
      batteryColor = '#ffba20'; // Amber warning
    } else {
      batteryIcon = 'battery_alert';
      batteryColor = '#ff5252'; // Danger red
    }
  }

  const batteryTooltip = batterySupported
    ? `Device Battery: ${batteryLevel}% (${isCharging ? 'Charging' : 'Discharging'})`
    : `Device Power: AC Connected (100%)`;

  // Compute Wi-Fi Icon & Tooltip
  let wifiIcon = isOnline ? 'wifi' : 'wifi_off';
  let wifiColor = isOnline ? 'var(--accent-color, var(--color-cyan-dim))' : '#ff5252';
  const wifiTooltip = isOnline
    ? `Wi-Fi / Network: Online (${networkType.toUpperCase()}${downlinkMb ? ` • ${downlinkMb} Mbps` : ''})`
    : `Wi-Fi / Network: Offline (Disconnected)`;

  // Compute Signal Strength Icon & Tooltip
  let signalBars = 4;
  let signalIcon = 'signal_cellular_alt';
  let signalColor = 'var(--accent-color, var(--color-cyan-dim))';

  if (!isOnline) {
    signalBars = 0;
    signalIcon = 'signal_cellular_off';
    signalColor = '#ff5252';
  } else if (rttMs !== null) {
    if (rttMs > 300) {
      signalBars = 1;
      signalIcon = 'signal_cellular_alt_1_bar';
      signalColor = '#ff5252';
    } else if (rttMs > 150) {
      signalBars = 2;
      signalIcon = 'signal_cellular_alt_2_bar';
      signalColor = '#ffba20';
    } else {
      signalBars = 4;
      signalIcon = 'signal_cellular_alt';
      signalColor = 'var(--accent-color, var(--color-cyan-dim))';
    }
  }

  const signalTooltip = isOnline
    ? `Signal Quality: ${signalBars === 4 ? 'Excellent' : signalBars === 2 ? 'Fair' : 'Weak'}${rttMs ? ` (${rttMs}ms Latency)` : ''}`
    : `Signal: Disconnected`;

  return {
    batterySupported,
    batteryLevel,
    isCharging,
    batteryIcon,
    batteryTooltip,
    batteryColor,

    isOnline,
    networkType,
    downlinkMb,
    rttMs,
    wifiIcon,
    wifiTooltip,
    wifiColor,

    signalBars,
    signalIcon,
    signalTooltip,
    signalColor,
  };
}
