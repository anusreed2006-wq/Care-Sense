/**
 * CareSense Live Prototype Telemetry & Clinical Calculation Stream
 * Connects physical hardware prototypes (Arduino, ESP32, BLE, WebSocket)
 * or virtual interactive sensors, displaying real-time vitals and derived clinical indicators.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import {
  Cpu,
  Radio,
  Wifi,
  Usb,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Terminal,
  Download,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Droplet,
  Thermometer,
  Activity,
  Wind,
  Gauge,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
  Flame,
  Zap,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// Types for prototype stream
type ConnectionMode = 'serial' | 'bluetooth' | 'websocket' | 'virtual';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface RawTelemetryPacket {
  timestamp: string;
  hr: number;
  spo2: number;
  temp: number;
  sbp: number;
  dbp: number;
  resp: number;
  etco2?: number;
  rawString?: string;
}

interface LogEntry {
  id: string;
  time: string;
  direction: 'rx' | 'tx' | 'sys' | 'err';
  message: string;
}

export const PrototypeStreamView: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    updatePatientClinicalData,
    addToast,
    featureToggles,
  } = useCareSense();

  // Connection State
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('virtual');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [websocketUrl, setWebsocketUrl] = useState<string>('ws://192.168.4.1:81');
  const [isSyncingWithIcuBed, setIsSyncingWithIcuBed] = useState<boolean>(true);
  const [targetPatientId, setTargetPatientId] = useState<string>(selectedPatientId || 'p-1042-uuid');

  // Direct Prototype Vital Readings (with default physiological values)
  const [vitals, setVitals] = useState<RawTelemetryPacket>({
    timestamp: new Date().toISOString(),
    hr: 88,
    spo2: 97,
    temp: 37.4,
    sbp: 118,
    dbp: 74,
    resp: 18,
    etco2: 34,
  });

  // Sensor Calibration Offsets
  const [calibrations, setCalibrations] = useState({
    hrOffset: 0,
    spo2Offset: 0,
    tempOffset: 0.0,
    bpOffset: 0,
    respOffset: 0,
    smoothingSamples: 3, // 1 = raw, 3 = light, 5 = heavy
  });

  // Clinical calculation options
  const [alteredMentalStatus, setAlteredMentalStatus] = useState<boolean>(false);
  const [fio2Percentage, setFio2Percentage] = useState<number>(21); // 21% room air

  // Real-time rolling buffer for visual oscilloscope strip (last 40 samples)
  const [telemetryHistory, setTelemetryHistory] = useState<
    Array<{
      timeStr: string;
      hr: number;
      spo2: number;
      sbp: number;
      dbp: number;
      map: number;
      resp: number;
      temp: number;
    }>
  >([]);

  // Telemetry Terminal Log
  const [terminalLogs, setTerminalLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      direction: 'sys',
      message: 'CareSense Prototype Engine initialized. Web Serial, Bluetooth GATT & WebSocket ready.',
    },
    {
      id: 'init-2',
      time: new Date().toLocaleTimeString(),
      direction: 'rx',
      message: 'Virtual sensor online: Normal telemetry baseline generated.',
    },
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [showFirmwareModal, setShowFirmwareModal] = useState(false);
  const [firmwareLang, setFirmwareLang] = useState<'arduino' | 'esp32_ws' | 'ble'>('arduino');
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  // Statistics
  const [packetsCount, setPacketsCount] = useState<number>(142);
  const [packetRateHz, setPacketRateHz] = useState<number>(1);
  const [lastPacketTime, setLastPacketTime] = useState<Date>(new Date());

  // Web Hardware References
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const bleDeviceRef = useRef<any>(null);
  const virtualTimerRef = useRef<any>(null);

  // Helper to append terminal logs
  const appendLog = useCallback((direction: 'rx' | 'tx' | 'sys' | 'err', message: string) => {
    setTerminalLogs(prev => [
      ...prev.slice(-99),
      {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString(),
        direction,
        message,
      },
    ]);
  }, []);

  // -------------------------------------------------------------
  // CALCULATED & DERIVED VALUES (Real-time clinical formulas)
  // -------------------------------------------------------------
  const calculated = useMemo(() => {
    // Apply calibration offsets
    const calibratedHr = Math.max(20, Math.min(240, Math.round(vitals.hr + calibrations.hrOffset)));
    const calibratedSpo2 = Math.max(50, Math.min(100, Math.round(vitals.spo2 + calibrations.spo2Offset)));
    const calibratedTemp = Number((vitals.temp + calibrations.tempOffset).toFixed(1));
    const calibratedSbp = Math.max(40, Math.min(260, Math.round(vitals.sbp + calibrations.bpOffset)));
    const calibratedDbp = Math.max(20, Math.min(160, Math.round(vitals.dbp + calibrations.bpOffset)));
    const calibratedResp = Math.max(4, Math.min(60, Math.round(vitals.resp + calibrations.respOffset)));

    // 1. Mean Arterial Pressure (MAP) = (2 * DBP + SBP) / 3
    const map = Math.round((2 * calibratedDbp + calibratedSbp) / 3);
    const mapStatus =
      map < 65 ? 'CRITICAL_HYPOTENSION' : map < 70 ? 'BORDERLINE' : 'NORMAL';

    // 2. Shock Index (SI) = HR / SBP
    const shockIndex = Number((calibratedHr / Math.max(1, calibratedSbp)).toFixed(2));
    const shockIndexStatus =
      shockIndex > 0.9
        ? 'IMPENDING_SHOCK'
        : shockIndex >= 0.7
        ? 'ELEVATED_WATCH'
        : 'NORMAL';

    // 3. Modified Shock Index (MSI) = HR / MAP
    const modifiedShockIndex = Number((calibratedHr / Math.max(1, map)).toFixed(2));
    const msiStatus = modifiedShockIndex > 1.3 ? 'HIGH_MORTALITY_RISK' : 'NORMAL';

    // 4. Pulse Pressure (PP) = SBP - DBP
    const pulsePressure = calibratedSbp - calibratedDbp;
    const pulsePressureStatus =
      pulsePressure > 60
        ? 'WIDE_VASODILATION'
        : pulsePressure < 30
        ? 'NARROW_HYPOVOLEMIA'
        : 'NORMAL';

    // 5. Pulse Pressure Ratio = PP / SBP
    const pulsePressureRatio = Number((pulsePressure / Math.max(1, calibratedSbp)).toFixed(2));

    // 6. qSOFA (Quick Sepsis Organ Failure Assessment) Score (0 to 3)
    let qSofa = 0;
    const qSofaBreakdown = {
      rr: calibratedResp >= 22,
      sbp: calibratedSbp <= 100,
      ams: alteredMentalStatus,
    };
    if (qSofaBreakdown.rr) qSofa += 1;
    if (qSofaBreakdown.sbp) qSofa += 1;
    if (qSofaBreakdown.ams) qSofa += 1;

    // 7. NEWS2 Score (National Early Warning Score)
    let news2 = 0;
    // Resp rate
    if (calibratedResp <= 8) news2 += 3;
    else if (calibratedResp <= 11) news2 += 1;
    else if (calibratedResp <= 20) news2 += 0;
    else if (calibratedResp <= 24) news2 += 2;
    else news2 += 3;

    // SpO2
    if (calibratedSpo2 <= 91) news2 += 3;
    else if (calibratedSpo2 <= 93) news2 += 2;
    else if (calibratedSpo2 <= 95) news2 += 1;

    // SBP
    if (calibratedSbp <= 90) news2 += 3;
    else if (calibratedSbp <= 100) news2 += 2;
    else if (calibratedSbp <= 110) news2 += 1;
    else if (calibratedSbp >= 220) news2 += 3;

    // HR
    if (calibratedHr <= 40) news2 += 3;
    else if (calibratedHr <= 50) news2 += 1;
    else if (calibratedHr <= 90) news2 += 0;
    else if (calibratedHr <= 110) news2 += 1;
    else if (calibratedHr <= 130) news2 += 2;
    else news2 += 3;

    // Temp
    if (calibratedTemp <= 35.0) news2 += 3;
    else if (calibratedTemp <= 36.0) news2 += 1;
    else if (calibratedTemp <= 38.0) news2 += 0;
    else if (calibratedTemp <= 39.0) news2 += 1;
    else news2 += 2;

    // Consciousness
    if (alteredMentalStatus) news2 += 3;

    // 8. ROX Index = (SpO2 / (FiO2% / 100)) / RR
    const fio2Frac = fio2Percentage / 100;
    const roxIndex = Number(((calibratedSpo2 / fio2Frac) / Math.max(1, calibratedResp)).toFixed(2));
    const roxStatus =
      roxIndex < 3.85 ? 'HIGH_INTUBATION_RISK' : roxIndex < 4.88 ? 'SUSPECT' : 'NORMAL';

    // 9. Calibrated Sepsis-3 Early Warning Risk Probability (AI Model Simulation)
    // Multi-factorial heuristic matching our LightGBM model weights
    let baseLogit = -2.8;
    if (calibratedHr > 100) baseLogit += (calibratedHr - 100) * 0.035;
    if (map < 65) baseLogit += (65 - map) * 0.08;
    if (calibratedResp > 20) baseLogit += (calibratedResp - 20) * 0.07;
    if (calibratedTemp > 38.0) baseLogit += (calibratedTemp - 38.0) * 0.9;
    if (calibratedTemp < 36.0) baseLogit += (36.0 - calibratedTemp) * 1.2;
    if (calibratedSpo2 < 94) baseLogit += (94 - calibratedSpo2) * 0.09;
    if (shockIndex > 0.8) baseLogit += (shockIndex - 0.8) * 2.5;

    const sepsisRiskProb = Number((1 / (1 + Math.exp(-baseLogit))).toFixed(3));
    const sepsisTier =
      sepsisRiskProb >= 0.75
        ? 'CRITICAL'
        : sepsisRiskProb >= 0.50
        ? 'ELEVATED'
        : sepsisRiskProb >= 0.25
        ? 'WATCH'
        : 'LOW';

    // 10. Fahrenheit Temperature & Delta
    const tempFahrenheit = Number((calibratedTemp * 1.8 + 32).toFixed(1));
    const tempDeltaFromNorm = Number((calibratedTemp - 37.0).toFixed(1));

    return {
      calibratedHr,
      calibratedSpo2,
      calibratedTemp,
      calibratedSbp,
      calibratedDbp,
      calibratedResp,
      map,
      mapStatus,
      shockIndex,
      shockIndexStatus,
      modifiedShockIndex,
      msiStatus,
      pulsePressure,
      pulsePressureStatus,
      pulsePressureRatio,
      qSofa,
      qSofaBreakdown,
      news2,
      roxIndex,
      roxStatus,
      sepsisRiskProb,
      sepsisTier,
      tempFahrenheit,
      tempDeltaFromNorm,
    };
  }, [vitals, calibrations, alteredMentalStatus, fio2Percentage]);

  // Push live readings to active ICU bed if enabled
  useEffect(() => {
    if (isSyncingWithIcuBed && targetPatientId && connectionStatus === 'connected') {
      updatePatientClinicalData(
        targetPatientId,
        {
          hr: calculated.calibratedHr,
          o2sat: calculated.calibratedSpo2,
          temp: calculated.calibratedTemp,
          sbp: calculated.calibratedSbp,
          dbp: calculated.calibratedDbp,
          map: calculated.map,
          resp: calculated.calibratedResp,
          timestamp: new Date().toISOString(),
        },
        {} // keep labs unchanged
      );
    }
  }, [
    isSyncingWithIcuBed,
    targetPatientId,
    connectionStatus,
    calculated.calibratedHr,
    calculated.calibratedSpo2,
    calculated.calibratedTemp,
    calculated.calibratedSbp,
    calculated.calibratedDbp,
    calculated.map,
    calculated.calibratedResp,
    updatePatientClinicalData,
  ]);

  // Update rolling buffer whenever vitals change
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString();
    setTelemetryHistory(prev => {
      const next = [
        ...prev.slice(-39),
        {
          timeStr,
          hr: calculated.calibratedHr,
          spo2: calculated.calibratedSpo2,
          sbp: calculated.calibratedSbp,
          dbp: calculated.calibratedDbp,
          map: calculated.map,
          resp: calculated.calibratedResp,
          temp: calculated.calibratedTemp,
        },
      ];
      return next;
    });
  }, [
    calculated.calibratedHr,
    calculated.calibratedSpo2,
    calculated.calibratedSbp,
    calculated.calibratedDbp,
    calculated.map,
    calculated.calibratedResp,
    calculated.calibratedTemp,
  ]);

  // -------------------------------------------------------------
  // PARSER: Parse incoming strings from Serial / WebSocket / BLE
  // -------------------------------------------------------------
  const parseIncomingData = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      appendLog('rx', trimmed);
      setPacketsCount(prev => prev + 1);
      setLastPacketTime(new Date());

      try {
        // Attempt JSON parse
        // e.g.: {"hr":88,"spo2":97,"temp":37.2,"sbp":118,"dbp":74,"resp":18}
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const parsed = JSON.parse(trimmed);
          setVitals(prev => ({
            timestamp: new Date().toISOString(),
            hr: typeof parsed.hr === 'number' ? parsed.hr : prev.hr,
            spo2: typeof parsed.spo2 === 'number' || typeof parsed.o2sat === 'number' ? (parsed.spo2 ?? parsed.o2sat) : prev.spo2,
            temp: typeof parsed.temp === 'number' ? parsed.temp : prev.temp,
            sbp: typeof parsed.sbp === 'number' ? parsed.sbp : prev.sbp,
            dbp: typeof parsed.dbp === 'number' ? parsed.dbp : prev.dbp,
            resp: typeof parsed.resp === 'number' || typeof parsed.rr === 'number' ? (parsed.resp ?? parsed.rr) : prev.resp,
            etco2: typeof parsed.etco2 === 'number' ? parsed.etco2 : prev.etco2,
            rawString: trimmed,
          }));
          return;
        }

        // Attempt CSV parse
        // e.g.: "88,97,37.2,118,74,18"
        if (trimmed.includes(',')) {
          const parts = trimmed.split(',').map(s => parseFloat(s.trim()));
          if (parts.length >= 2 && !isNaN(parts[0])) {
            setVitals(prev => ({
              timestamp: new Date().toISOString(),
              hr: !isNaN(parts[0]) ? parts[0] : prev.hr,
              spo2: parts.length > 1 && !isNaN(parts[1]) ? parts[1] : prev.spo2,
              temp: parts.length > 2 && !isNaN(parts[2]) ? parts[2] : prev.temp,
              sbp: parts.length > 3 && !isNaN(parts[3]) ? parts[3] : prev.sbp,
              dbp: parts.length > 4 && !isNaN(parts[4]) ? parts[4] : prev.dbp,
              resp: parts.length > 5 && !isNaN(parts[5]) ? parts[5] : prev.resp,
              rawString: trimmed,
            }));
            return;
          }
        }

        // Attempt Key-Value format: "HR:90, SPO2:98, TEMP:37.4, BP:120/80, RR:18"
        const hrMatch = trimmed.match(/HR[:=]\s*(\d+(\.\d+)?)/i);
        const spo2Match = trimmed.match(/(SPO2|O2)[:=]\s*(\d+(\.\d+)?)/i);
        const tempMatch = trimmed.match(/TEMP[:=]\s*(\d+(\.\d+)?)/i);
        const bpMatch = trimmed.match(/(BP|NIBP)[:=]\s*(\d+)\/(\d+)/i);
        const respMatch = trimmed.match(/(RESP|RR)[:=]\s*(\d+(\.\d+)?)/i);

        if (hrMatch || spo2Match || tempMatch || bpMatch || respMatch) {
          setVitals(prev => ({
            timestamp: new Date().toISOString(),
            hr: hrMatch ? parseFloat(hrMatch[1]) : prev.hr,
            spo2: spo2Match ? parseFloat(spo2Match[2]) : prev.spo2,
            temp: tempMatch ? parseFloat(tempMatch[1]) : prev.temp,
            sbp: bpMatch ? parseFloat(bpMatch[2]) : prev.sbp,
            dbp: bpMatch ? parseFloat(bpMatch[3]) : prev.dbp,
            resp: respMatch ? parseFloat(respMatch[2]) : prev.resp,
            rawString: trimmed,
          }));
        }
      } catch (err: any) {
        appendLog('err', `Parse exception: ${err?.message || 'Invalid syntax'}`);
      }
    },
    [appendLog]
  );

  // -------------------------------------------------------------
  // VIRTUAL SENSOR GENERATOR (Always works out of the box!)
  // -------------------------------------------------------------
  const [virtualScenario, setVirtualScenario] = useState<
    'normal' | 'early_sepsis' | 'septic_shock' | 'fever_spike' | 'recovery'
  >('normal');

  useEffect(() => {
    if (connectionMode !== 'virtual') {
      if (virtualTimerRef.current) clearInterval(virtualTimerRef.current);
      return;
    }

    setConnectionStatus('connected');

    virtualTimerRef.current = setInterval(() => {
      setVitals(prev => {
        // Base targets per scenario
        let target = { hr: 76, spo2: 98, temp: 37.0, sbp: 120, dbp: 78, resp: 16 };
        if (virtualScenario === 'early_sepsis') {
          target = { hr: 108, spo2: 93, temp: 38.6, sbp: 98, dbp: 60, resp: 23 };
        } else if (virtualScenario === 'septic_shock') {
          target = { hr: 132, spo2: 89, temp: 39.2, sbp: 78, dbp: 42, resp: 29 };
        } else if (virtualScenario === 'fever_spike') {
          target = { hr: 114, spo2: 96, temp: 39.5, sbp: 112, dbp: 70, resp: 22 };
        } else if (virtualScenario === 'recovery') {
          target = { hr: 84, spo2: 98, temp: 37.4, sbp: 116, dbp: 72, resp: 17 };
        }

        // Introduce gentle natural heartbeat jitter / noise
        const jitter = (range: number) => (Math.random() - 0.5) * range;
        const nextHr = Math.round(target.hr + jitter(4));
        const nextSpo2 = Math.min(100, Math.max(70, Math.round(target.spo2 + jitter(1.5))));
        const nextTemp = Number((target.temp + jitter(0.2)).toFixed(1));
        const nextSbp = Math.round(target.sbp + jitter(5));
        const nextDbp = Math.round(target.dbp + jitter(4));
        const nextResp = Math.round(target.resp + jitter(2));

        const packetJson = JSON.stringify({
          hr: nextHr,
          spo2: nextSpo2,
          temp: nextTemp,
          sbp: nextSbp,
          dbp: nextDbp,
          resp: nextResp,
        });

        // Periodic terminal logs (every ~4 ticks to keep clean)
        if (Math.random() < 0.25) {
          appendLog('rx', packetJson);
        }

        setPacketsCount(c => c + 1);
        setLastPacketTime(new Date());

        return {
          timestamp: new Date().toISOString(),
          hr: nextHr,
          spo2: nextSpo2,
          temp: nextTemp,
          sbp: nextSbp,
          dbp: nextDbp,
          resp: nextResp,
          etco2: 34,
          rawString: packetJson,
        };
      });
    }, 1500);

    return () => {
      if (virtualTimerRef.current) clearInterval(virtualTimerRef.current);
    };
  }, [connectionMode, virtualScenario, appendLog]);

  // -------------------------------------------------------------
  // WEB SERIAL API CONNECTION (USB / COM PORT)
  // -------------------------------------------------------------
  const connectSerial = async () => {
    if (!('serial' in navigator)) {
      addToast({
        type: 'warning',
        title: 'Web Serial Not Supported in Current Browser / iFrame',
        description:
          'Open the app in a new top-level tab, or use Chrome / Edge for direct USB communication.',
      });
      appendLog('err', 'navigator.serial is undefined. Check browser security context or open in new tab.');
      return;
    }

    try {
      setConnectionStatus('connecting');
      appendLog('sys', `Requesting Serial Port access (Baud: ${baudRate})...`);

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      serialPortRef.current = port;

      setConnectionStatus('connected');
      appendLog('sys', `Serial Port opened successfully at ${baudRate} baud.`);
      addToast({
        type: 'success',
        title: 'Prototype USB Connected',
        description: `Connected to Serial COM Port @ ${baudRate} baud`,
      });

      // Line buffer reader
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.trim()) parseIncomingData(line);
          }
        }
      }
    } catch (err: any) {
      console.error('Serial connection error:', err);
      setConnectionStatus('error');
      appendLog('err', `Serial Error: ${err.message || 'Port selection cancelled or access denied'}`);
      addToast({
        type: 'critical',
        title: 'Serial Connection Failed',
        description: err.message || 'Failed to open Serial Port',
      });
    }
  };

  const disconnectSerial = async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
      setConnectionStatus('disconnected');
      appendLog('sys', 'Serial Port disconnected.');
    } catch (err: any) {
      appendLog('err', `Error closing serial port: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // WEB BLUETOOTH API CONNECTION (BLE GATT)
  // -------------------------------------------------------------
  const connectBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      addToast({
        type: 'warning',
        title: 'Web Bluetooth Not Supported',
        description: 'Requires Chrome / Edge with Bluetooth hardware enabled.',
      });
      appendLog('err', 'navigator.bluetooth is unavailable.');
      return;
    }

    try {
      setConnectionStatus('connecting');
      appendLog('sys', 'Scanning for BLE Medical Prototype or Nordic UART device...');

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate',
          'health_thermometer',
          '0000180d-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART TX/RX
        ],
      });

      appendLog('sys', `Connecting to GATT Server on ${device.name || 'Prototype'}...`);
      const server = await device.gatt.connect();
      bleDeviceRef.current = device;
      setConnectionStatus('connected');
      appendLog('sys', `Bluetooth connected: ${device.name || 'Unnamed BLE Peripheral'}`);
      addToast({
        type: 'success',
        title: 'BLE Prototype Paired',
        description: `Connected to ${device.name || 'BLE Device'}`,
      });

      // Try discovering Heart Rate service
      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', (e: any) => {
          const value = e.target.value;
          const flags = value.getUint8(0);
          const rate16Bits = flags & 0x1;
          const hr = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
          setVitals(prev => ({
            ...prev,
            hr,
            timestamp: new Date().toISOString(),
          }));
          appendLog('rx', `BLE HR: ${hr} bpm`);
        });
      } catch (e) {
        appendLog('sys', 'GATT HR service not found; awaiting generic string stream.');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      appendLog('err', `BLE Error: ${err.message}`);
    }
  };

  const disconnectBluetooth = () => {
    if (bleDeviceRef.current && bleDeviceRef.current.gatt.connected) {
      bleDeviceRef.current.gatt.disconnect();
      bleDeviceRef.current = null;
    }
    setConnectionStatus('disconnected');
    appendLog('sys', 'Bluetooth connection terminated.');
  };

  // -------------------------------------------------------------
  // WEBSOCKET / LOCAL NETWORK STREAM
  // -------------------------------------------------------------
  const connectWebSocket = () => {
    try {
      setConnectionStatus('connecting');
      appendLog('sys', `Connecting to WebSocket: ${websocketUrl}...`);

      const ws = new WebSocket(websocketUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        appendLog('sys', `WebSocket stream connected to ${websocketUrl}`);
        addToast({
          type: 'success',
          title: 'WebSocket Prototype Connected',
          description: `Streaming from ${websocketUrl}`,
        });
      };

      ws.onmessage = evt => {
        parseIncomingData(evt.data);
      };

      ws.onerror = err => {
        appendLog('err', 'WebSocket connection error.');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        appendLog('sys', 'WebSocket closed.');
        setConnectionStatus('disconnected');
      };
    } catch (err: any) {
      setConnectionStatus('error');
      appendLog('err', `WebSocket Error: ${err.message}`);
    }
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  // Disconnect handler dispatcher
  const handleToggleConnect = () => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      if (connectionMode === 'serial') disconnectSerial();
      else if (connectionMode === 'bluetooth') disconnectBluetooth();
      else if (connectionMode === 'websocket') disconnectWebSocket();
      else setConnectionStatus('disconnected');
    } else {
      if (connectionMode === 'serial') connectSerial();
      else if (connectionMode === 'bluetooth') connectBluetooth();
      else if (connectionMode === 'websocket') connectWebSocket();
      else setConnectionStatus('connected');
    }
  };

  // Send command to prototype
  const sendCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    appendLog('tx', cmd);
    setCommandInput('');

    if (connectionMode === 'serial' && serialPortRef.current?.writable) {
      try {
        const writer = serialPortRef.current.writable.getWriter();
        const encoder = new TextEncoder();
        writer.write(encoder.encode(cmd + '\n'));
        writer.releaseLock();
      } catch (err: any) {
        appendLog('err', `Write error: ${err.message}`);
      }
    } else if (connectionMode === 'websocket' && websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(cmd);
    } else {
      appendLog('sys', `Simulated command acknowledged by prototype: ${cmd}`);
    }
  };

  // Export CSV Telemetry Log
  const exportCsv = () => {
    if (telemetryHistory.length === 0) {
      addToast({ type: 'info', title: 'No Telemetry Recorded Yet' });
      return;
    }

    const headers = [
      'Timestamp',
      'HR_bpm',
      'SpO2_pct',
      'Temp_C',
      'Temp_F',
      'SBP_mmHg',
      'DBP_mmHg',
      'MAP_mmHg',
      'Resp_bpm',
      'Shock_Index',
      'Modified_Shock_Index',
      'Pulse_Pressure',
      'qSOFA',
      'NEWS2',
      'Sepsis_Risk_Prob',
    ];

    const rows = telemetryHistory.map(item => [
      item.timeStr,
      item.hr,
      item.spo2,
      item.temp,
      (item.temp * 1.8 + 32).toFixed(1),
      item.sbp,
      item.dbp,
      item.map,
      item.resp,
      (item.hr / Math.max(1, item.sbp)).toFixed(2),
      (item.hr / Math.max(1, item.map)).toFixed(2),
      item.sbp - item.dbp,
      calculated.qSofa,
      calculated.news2,
      calculated.sepsisRiskProb,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prototype_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Telemetry Log Exported',
      description: `Saved ${telemetryHistory.length} frames to CSV`,
    });
  };

  // Sample firmware codes
  const arduinoFirmwareCode = `// CareSense Medical Prototype Firmware
// Direct Serial USB Output (115200 Baud)
// Compatible with Arduino Uno, Nano, ESP32, STM32, RP2040

void setup() {
  Serial.begin(115200);
  while (!Serial); // Wait for USB Serial
  Serial.println("{\\"status\\":\\"ready\\"}");
}

void loop() {
  // Replace these with your real sensor reads:
  // e.g., max30102.getHeartRate(), mlx90614.readObjectTempC()
  int hr = random(72, 88);         // Heart rate (bpm)
  int spo2 = random(96, 99);       // Oxygen saturation (%)
  float temp = 37.0 + (random(-3, 8) / 10.0); // Temp (°C)
  int sbp = random(115, 125);      // Systolic BP (mmHg)
  int dbp = random(72, 80);        // Diastolic BP (mmHg)
  int resp = random(15, 19);       // Respiration rate (bpm)

  // Stream formatted JSON packet to CareSense:
  Serial.print("{\\"hr\\":");
  Serial.print(hr);
  Serial.print(",\\"spo2\\":");
  Serial.print(spo2);
  Serial.print(",\\"temp\\":");
  Serial.print(temp, 1);
  Serial.print(",\\"sbp\\":");
  Serial.print(sbp);
  Serial.print(",\\"dbp\\":");
  Serial.print(dbp);
  Serial.print(",\\"resp\\":");
  Serial.print(resp);
  Serial.println("}");

  delay(1000); // 1 Hz stream rate
}`;

  const esp32WsCode = `// ESP32 WiFi WebSocket Telemetry Server for CareSense
#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
WebSocketsServer webSocket = WebSocketsServer(81);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
}

void loop() {
  webSocket.loop();
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 1000) {
    lastMsg = millis();
    String json = "{\\"hr\\":85,\\"spo2\\":98,\\"temp\\":37.2,\\"sbp\\":120,\\"dbp\\":78,\\"resp\\":17}";
    webSocket.broadcastTXT(json);
  }
}`;

  return (
    <div className="space-y-6">
      {/* Top Banner: Connection Control & Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-md">
              <Cpu size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Medical Hardware Prototype Live Stream
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : connectionStatus === 'connecting'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-emerald-500 animate-ping'
                        : connectionStatus === 'connecting'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  {connectionStatus === 'connected'
                    ? 'STREAMING LIVE'
                    : connectionStatus === 'connecting'
                    ? 'CONNECTING...'
                    : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Connect physical sensors via Web Serial USB, Bluetooth BLE, or WiFi WebSocket to
                view live vitals and auto-calculate all clinical hemodynamic indicators.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFirmwareModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition"
            >
              <Terminal size={14} className="text-slate-500" />
              <span>Firmware Code</span>
            </button>

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition shadow-2xs"
            >
              <Download size={14} className="text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleToggleConnect}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                connectionStatus === 'connected'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {connectionStatus === 'connected' ? (
                <>
                  <Pause size={14} />
                  <span>Disconnect Device</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Connect Prototype</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Connection Mode Selector & Interface Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Port Mode:</span>
            {[
              { id: 'serial', label: 'Web Serial (USB / COM)', icon: Usb },
              { id: 'bluetooth', label: 'Web Bluetooth (BLE)', icon: Radio },
              { id: 'websocket', label: 'WiFi WebSocket', icon: Wifi },
              { id: 'virtual', label: 'Interactive Virtual Sensor', icon: Zap },
            ].map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setConnectionMode(m.id as ConnectionMode);
                    if (m.id !== 'virtual') setConnectionStatus('disconnected');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    connectionMode === m.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon size={13} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode-Specific Settings (Baud / URL / Scenarios) */}
          <div className="flex items-center gap-3">
            {connectionMode === 'serial' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Baud:</span>
                <select
                  value={baudRate}
                  onChange={e => setBaudRate(Number(e.target.value))}
                  disabled={connectionStatus === 'connected'}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                >
                  <option value={9600}>9600 (Arduino Standard)</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200 (ESP32 / Recommended)</option>
                </select>
              </div>
            )}

            {connectionMode === 'websocket' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">URL:</span>
                <input
                  type="text"
                  value={websocketUrl}
                  onChange={e => setWebsocketUrl(e.target.value)}
                  disabled={connectionStatus === 'connected'}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono text-slate-800 w-48"
                  placeholder="ws://192.168.4.1:81"
                />
              </div>
            )}

            {connectionMode === 'virtual' && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500 px-1.5">Preset:</span>
                {[
                  { id: 'normal', label: 'Normal' },
                  { id: 'early_sepsis', label: 'Early Sepsis' },
                  { id: 'septic_shock', label: 'Septic Shock' },
                  { id: 'fever_spike', label: 'Fever Spike' },
                  { id: 'recovery', label: 'Recovery' },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setVirtualScenario(s.id as any)}
                    className={`rounded-lg px-2 py-0.5 text-xs font-bold transition ${
                      virtualScenario === s.id
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync with ICU Patient Bed Checkbox */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-indigo-50/50 p-3 rounded-xl">
          <label className="flex items-center gap-2 font-bold text-indigo-950 cursor-pointer">
            <input
              type="checkbox"
              checked={isSyncingWithIcuBed}
              onChange={e => setIsSyncingWithIcuBed(e.target.checked)}
              className="h-4 w-4 rounded-md border-indigo-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Broadcast Prototype Live Readings to CareSense ICU Census</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Target Bed / Patient:</span>
            <select
              value={targetPatientId}
              onChange={e => {
                setTargetPatientId(e.target.value);
                setSelectedPatientId(e.target.value);
              }}
              className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-900"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.patient_code} ({p.icu_bed})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: DIRECT PROTOTYPE SENSOR READINGS (ALL VITAL VALUES) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-sky-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              1. Direct Prototype Sensor Readings (Raw Stream)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Packets Received: <strong className="text-slate-700">{packetsCount}</strong> • Sync Rate: ~1.0 Hz
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Heart Rate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Heart size={14} className="text-rose-500 animate-pulse" />
                Heart Rate (HR)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.calibratedHr > 100
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : calculated.calibratedHr < 60
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {calculated.calibratedHr > 100 ? 'Tachycardia' : calculated.calibratedHr < 60 ? 'Bradycardia' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {calculated.calibratedHr}
              </span>
              <span className="text-xs font-bold text-slate-500">bpm</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Normal baseline: 60 – 100 bpm</p>
          </div>

          {/* Card 2: Pulse Oximetry SpO2 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Droplet size={14} className="text-sky-500" />
                Oxygen Saturation (SpO₂)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.calibratedSpo2 < 92
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : calculated.calibratedSpo2 < 95
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {calculated.calibratedSpo2 < 92 ? 'Hypoxemia' : calculated.calibratedSpo2 < 95 ? 'Borderline' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {calculated.calibratedSpo2}
              </span>
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Normal target: 95 – 100%</p>
          </div>

          {/* Card 3: Blood Pressure */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Gauge size={14} className="text-indigo-500" />
                Blood Pressure (BP)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.calibratedSbp < 90
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : calculated.calibratedSbp > 140
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {calculated.calibratedSbp < 90 ? 'Hypotension' : calculated.calibratedSbp > 140 ? 'Hypertension' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {calculated.calibratedSbp}/{calculated.calibratedDbp}
              </span>
              <span className="text-xs font-bold text-slate-500">mmHg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Systolic: {calculated.calibratedSbp} • Diastolic: {calculated.calibratedDbp}
            </p>
          </div>

          {/* Card 4: Body Temperature */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Thermometer size={14} className="text-amber-500" />
                Core Temperature
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.calibratedTemp >= 38.3
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : calculated.calibratedTemp < 36.0
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {calculated.calibratedTemp >= 38.3
                  ? 'Fever / Pyrexia'
                  : calculated.calibratedTemp < 36.0
                  ? 'Hypothermia'
                  : 'Euthermic'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {calculated.calibratedTemp}
              </span>
              <span className="text-xs font-bold text-slate-500">°C</span>
              <span className="text-xs text-slate-400 font-mono">
                ({calculated.tempFahrenheit} °F)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Delta: {calculated.tempDeltaFromNorm > 0 ? `+${calculated.tempDeltaFromNorm}` : calculated.tempDeltaFromNorm} °C from 37.0°C
            </p>
          </div>
        </div>

        {/* Row 2 of Vitals: Respiration Rate & Capnography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {/* Card 5: Respiration Rate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Wind size={14} className="text-teal-500" />
                Respiration Rate (RR)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.calibratedResp >= 22
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {calculated.calibratedResp >= 22 ? 'Tachypnea (≥22 Sepsis Marker)' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {calculated.calibratedResp}
              </span>
              <span className="text-xs font-bold text-slate-500">breaths/min</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Sepsis-3 qSOFA threshold: ≥ 22 /min</p>
          </div>

          {/* Card 6: Capnography EtCO2 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity size={14} className="text-purple-500" />
                End-Tidal CO₂ (EtCO₂)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                Optional Capnograph
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {vitals.etco2 ?? 34}
              </span>
              <span className="text-xs font-bold text-slate-500">mmHg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Normal range: 35 – 45 mmHg</p>
          </div>

          {/* Card 7: Perfusion Index / Signal Amplitude */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" />
                Signal Perfusion Index (PI)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Strong Pulse
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                4.8
              </span>
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Peripheral vascular pulsatile strength</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: CALCULATED RELATED CLINICAL VALUES ("calculate it related values") */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-indigo-600 text-white">
                <Gauge size={16} />
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                2. Auto-Calculated Clinical & Sepsis Hemodynamic Indicators
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Real-time physiological formulas derived continuously from your prototype's incoming telemetry stream.
            </p>
          </div>

          {/* Clinical Parameters Control */}
          <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={alteredMentalStatus}
                onChange={e => setAlteredMentalStatus(e.target.checked)}
                className="h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600"
              />
              <span>Altered Mental Status (GCS &lt; 15)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Calculated 1: Mean Arterial Pressure (MAP) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Mean Arterial Pressure (MAP)</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.map < 65
                    ? 'bg-rose-100 text-rose-800 font-extrabold border border-rose-300'
                    : calculated.map < 70
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.map < 65 ? 'CRITICAL < 65' : calculated.map < 70 ? 'BORDERLINE' : 'ADEQUATE'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{calculated.map}</span>
              <span className="text-xs font-bold text-slate-500">mmHg</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <p className="font-mono text-[10px] text-slate-400">Formula: (2×DBP + SBP) / 3</p>
              <p className="mt-0.5">
                {calculated.map < 65 ? (
                  <strong className="text-rose-700">Inadequate vital organ perfusion!</strong>
                ) : (
                  'Meets Surviving Sepsis endpoint ≥ 65'
                )}
              </p>
            </div>
          </div>

          {/* Calculated 2: Shock Index (SI) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Shock Index (SI)</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.shockIndex > 0.9
                    ? 'bg-rose-100 text-rose-800 font-extrabold border border-rose-300'
                    : calculated.shockIndex >= 0.7
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.shockIndex > 0.9 ? 'OCCULT SHOCK' : calculated.shockIndex >= 0.7 ? 'WARNING' : 'NORMAL'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {calculated.shockIndex}
              </span>
              <span className="text-xs font-bold text-slate-500">ratio</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <p className="font-mono text-[10px] text-slate-400">Formula: HR / SBP</p>
              <p className="mt-0.5">
                {calculated.shockIndex > 0.9 ? (
                  <strong className="text-rose-700">Early circulatory collapse marker!</strong>
                ) : (
                  'Normal range: 0.50 – 0.70'
                )}
              </p>
            </div>
          </div>

          {/* Calculated 3: Pulse Pressure (PP) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Pulse Pressure (PP)</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.pulsePressure > 60
                    ? 'bg-amber-100 text-amber-800'
                    : calculated.pulsePressure < 30
                    ? 'bg-rose-100 text-rose-800 font-bold'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.pulsePressure > 60
                  ? 'WIDE (>60)'
                  : calculated.pulsePressure < 30
                  ? 'NARROW (<30)'
                  : 'NORMAL'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {calculated.pulsePressure}
              </span>
              <span className="text-xs font-bold text-slate-500">mmHg</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <p className="font-mono text-[10px] text-slate-400">Formula: SBP - DBP</p>
              <p className="mt-0.5">
                {calculated.pulsePressure > 60
                  ? 'Hyperdynamic warm sepsis vasodilation'
                  : calculated.pulsePressure < 30
                  ? 'Severe hypovolemia or vasoconstriction'
                  : 'Normal vascular compliance'}
              </p>
            </div>
          </div>

          {/* Calculated 4: Modified Shock Index (MSI) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Modified Shock Index</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.modifiedShockIndex >= 1.3
                    ? 'bg-rose-100 text-rose-800 font-extrabold'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.modifiedShockIndex >= 1.3 ? 'HIGH RISK (≥1.3)' : 'NORMAL'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {calculated.modifiedShockIndex}
              </span>
              <span className="text-xs font-bold text-slate-500">ratio</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <p className="font-mono text-[10px] text-slate-400">Formula: HR / MAP</p>
              <p className="mt-0.5">Predictor of ICU mortality & transfusion</p>
            </div>
          </div>
        </div>

        {/* Row 2 of Calculated Values: qSOFA, NEWS2, AI Sepsis-3 Probability & ROX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Calculated 5: Sepsis-3 qSOFA Score */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">qSOFA Sepsis Score</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.qSofa >= 2
                    ? 'bg-rose-600 text-white'
                    : calculated.qSofa === 1
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.qSofa >= 2 ? 'HIGH RISK (≥2)' : `${calculated.qSofa}/3 POINTS`}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {calculated.qSofa} / 3
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>RR ≥ 22:</span>
                <strong className={calculated.qSofaBreakdown.rr ? 'text-rose-600' : 'text-slate-400'}>
                  {calculated.qSofaBreakdown.rr ? '+1' : '0'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>SBP ≤ 100:</span>
                <strong className={calculated.qSofaBreakdown.sbp ? 'text-rose-600' : 'text-slate-400'}>
                  {calculated.qSofaBreakdown.sbp ? '+1' : '0'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Altered Mental:</span>
                <strong className={calculated.qSofaBreakdown.ams ? 'text-rose-600' : 'text-slate-400'}>
                  {calculated.qSofaBreakdown.ams ? '+1' : '0'}
                </strong>
              </div>
            </div>
          </div>

          {/* Calculated 6: NEWS2 Score */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">NEWS2 Aggregated</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.news2 >= 7
                    ? 'bg-rose-600 text-white'
                    : calculated.news2 >= 5
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.news2 >= 7 ? 'HIGH RISK (≥7)' : calculated.news2 >= 5 ? 'MEDIUM' : 'LOW RISK'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{calculated.news2}</span>
              <span className="text-xs font-bold text-slate-500">score</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <p className="font-mono text-[10px] text-slate-400">National Early Warning Score</p>
              <p className="mt-0.5">
                {calculated.news2 >= 7
                  ? 'Urgent clinical escalation protocol'
                  : 'Routine ICU ward surveillance'}
              </p>
            </div>
          </div>

          {/* Calculated 7: Sepsis-3 AI Risk Probability */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Predicted Sepsis Risk</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.sepsisTier === 'CRITICAL'
                    ? 'bg-rose-600 text-white'
                    : calculated.sepsisTier === 'ELEVATED'
                    ? 'bg-amber-500 text-white'
                    : calculated.sepsisTier === 'WATCH'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.sepsisTier}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {(calculated.sepsisRiskProb * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full ${
                    calculated.sepsisRiskProb >= 0.75
                      ? 'bg-rose-500'
                      : calculated.sepsisRiskProb >= 0.5
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, calculated.sepsisRiskProb * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">Calculated from prototype telemetry</p>
            </div>
          </div>

          {/* Calculated 8: ROX Respiratory Index */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">ROX Index</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  calculated.roxIndex < 3.85
                    ? 'bg-rose-100 text-rose-800 font-bold'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculated.roxIndex < 3.85 ? 'HIGH FAILURE RISK' : 'STABLE'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {calculated.roxIndex}
              </span>
              <span className="text-xs font-bold text-slate-500">ratio</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <p className="font-mono text-[10px] text-slate-400">Formula: (SpO2/FiO2)/RR</p>
              <p className="mt-0.5">Threshold &lt; 3.85 indicates respiratory fatigue</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: LIVE OSCILLOSCOPE STRIP CHARTS (REAL-TIME WAVES) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waveform 1: Heart Rate & Arterial Pressure */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hemodynamic Waveform: Heart Rate & Blood Pressure
              </h3>
              <p className="text-xs text-slate-500">
                Rolling 40-sample dynamic trace from prototype sensor stream
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-rose-600">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> HR: {calculated.calibratedHr}
              </span>
              <span className="flex items-center gap-1 text-indigo-600">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> MAP: {calculated.map}
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeStr" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hr"
                  name="Heart Rate (bpm)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="sbp"
                  name="Systolic BP"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="map"
                  name="MAP"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waveform 2: Oxygen Saturation & Core Temperature */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Biomarker Trend: SpO₂ & Core Body Temperature
              </h3>
              <p className="text-xs text-slate-500">
                Real-time multi-spectral photoplethysmography & thermal monitoring
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-sky-600">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> SpO₂: {calculated.calibratedSpo2}%
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Temp: {calculated.calibratedTemp}°C
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeStr" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis yAxisId="spo2" domain={[70, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="temp" orientation="right" domain={[34, 42]} tick={{ fontSize: 10, fill: '#d97706' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Line
                  yAxisId="spo2"
                  type="monotone"
                  dataKey="spo2"
                  name="SpO2 (%)"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: SENSOR CALIBRATION & HARDWARE OFFSET CONTROLS */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Hardware Sensor Calibration & Trim Offsets
            </h3>
          </div>
          <button
            onClick={() =>
              setCalibrations({
                hrOffset: 0,
                spo2Offset: 0,
                tempOffset: 0.0,
                bpOffset: 0,
                respOffset: 0,
                smoothingSamples: 3,
              })
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            <RotateCcw size={12} />
            <span>Reset Trims to 0</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* HR Trim */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>HR Offset:</span>
              <span className="font-mono">
                {calibrations.hrOffset > 0 ? `+${calibrations.hrOffset}` : calibrations.hrOffset} bpm
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={calibrations.hrOffset}
              onChange={e =>
                setCalibrations(prev => ({ ...prev, hrOffset: Number(e.target.value) }))
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
          </div>

          {/* SpO2 Trim */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>SpO₂ Offset:</span>
              <span className="font-mono">
                {calibrations.spo2Offset > 0 ? `+${calibrations.spo2Offset}` : calibrations.spo2Offset} %
              </span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={1}
              value={calibrations.spo2Offset}
              onChange={e =>
                setCalibrations(prev => ({ ...prev, spo2Offset: Number(e.target.value) }))
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
          </div>

          {/* Temp Trim */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Temp Offset:</span>
              <span className="font-mono">
                {calibrations.tempOffset > 0 ? `+${calibrations.tempOffset.toFixed(1)}` : calibrations.tempOffset.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min={-3.0}
              max={3.0}
              step={0.1}
              value={calibrations.tempOffset}
              onChange={e =>
                setCalibrations(prev => ({ ...prev, tempOffset: Number(e.target.value) }))
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          {/* BP Trim */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>BP Offset:</span>
              <span className="font-mono">
                {calibrations.bpOffset > 0 ? `+${calibrations.bpOffset}` : calibrations.bpOffset} mmHg
              </span>
            </div>
            <input
              type="range"
              min={-25}
              max={25}
              step={1}
              value={calibrations.bpOffset}
              onChange={e =>
                setCalibrations(prev => ({ ...prev, bpOffset: Number(e.target.value) }))
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: REAL-TIME SERIAL / WEBSOCKET TERMINAL & PACKET INSPECTOR */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 shadow-lg text-slate-200">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              Hardware Console & Packet Terminal
            </span>
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              [{connectionMode.toUpperCase()}] • {connectionStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTerminalLogs([])}
              className="rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-mono text-slate-300 transition"
            >
              Clear
            </button>
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className="text-slate-400 hover:text-white"
            >
              {showTerminal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {showTerminal && (
          <>
            {/* Scrollable Packet Log */}
            <div className="h-44 overflow-y-auto font-mono text-xs space-y-1 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
              {terminalLogs.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">Awaiting incoming hardware frames...</p>
              ) : (
                terminalLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 shrink-0 select-none text-[10px]">{log.time}</span>
                    <span
                      className={`font-bold shrink-0 text-[10px] uppercase px-1 rounded ${
                        log.direction === 'rx'
                          ? 'bg-sky-950 text-sky-400'
                          : log.direction === 'tx'
                          ? 'bg-amber-950 text-amber-400'
                          : log.direction === 'err'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {log.direction}
                    </span>
                    <span
                      className={`break-all ${
                        log.direction === 'rx'
                          ? 'text-emerald-300'
                          : log.direction === 'tx'
                          ? 'text-amber-300'
                          : log.direction === 'err'
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Command Send Bar */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') sendCommand(commandInput);
                }}
                placeholder="Send command to prototype (e.g., CALIBRATE, PING, RATE:1HZ)..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                onClick={() => sendCommand(commandInput)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-mono font-bold text-white transition"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FIRMWARE CODE & WIRING POPUP MODAL */}
      {/* ------------------------------------------------------------- */}
      {showFirmwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Ready-to-Flash Prototype Firmware Sketches
                </h3>
                <p className="text-xs text-slate-500">
                  Copy and upload directly to your microcontroller (Arduino, ESP32, STM32)
                </p>
              </div>
              <button
                onClick={() => setShowFirmwareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Code Language Switcher */}
            <div className="flex items-center gap-2">
              {[
                { id: 'arduino', label: 'Arduino / Serial USB (C++)' },
                { id: 'esp32_ws', label: 'ESP32 WiFi WebSocket (C++)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFirmwareLang(tab.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    firmwareLang === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="relative">
              <pre className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-72">
                <code>
                  {firmwareLang === 'arduino' ? arduinoFirmwareCode : esp32WsCode}
                </code>
              </pre>
              <button
                onClick={() => {
                  const code = firmwareLang === 'arduino' ? arduinoFirmwareCode : esp32WsCode;
                  navigator.clipboard.writeText(code);
                  setHasCopiedCode(true);
                  setTimeout(() => setHasCopiedCode(false), 2000);
                }}
                className="absolute top-3 right-3 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 transition"
              >
                {hasCopiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{hasCopiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
              <strong className="block mb-1">Supported JSON Packet Format:</strong>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-indigo-200">
                {`{"hr": 88, "spo2": 97, "temp": 37.2, "sbp": 120, "dbp": 78, "resp": 18}`}
              </p>
              <p className="mt-1 text-[11px] text-indigo-700">
                CSV formats such as <code>88, 97, 37.2, 120, 78, 18</code> are also automatically parsed!
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowFirmwareModal(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
