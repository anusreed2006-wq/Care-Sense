import { MetricHistoryModalData, MetricHistoryItem } from '../types';

interface MetricConfig {
  title: string;
  unit: string;
  normalRange: string;
  criticalThreshold?: string;
  description: string;
  color: string;
  referenceLineLow?: number;
  referenceLineHigh?: number;
  decimals: number;
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  hr: {
    title: 'Heart Rate (HR)',
    unit: 'bpm',
    normalRange: '60 - 100 bpm',
    criticalThreshold: '> 100 bpm (Tachycardia) or < 50 bpm',
    description: 'Continuous electrocardiographic pulse rate. Tachycardia is a core component of Systemic Inflammatory Response Syndrome (SIRS) and early sepsis compensation.',
    color: '#ef4444',
    referenceLineLow: 60,
    referenceLineHigh: 100,
    decimals: 0,
  },
  map: {
    title: 'Mean Arterial Pressure (MAP)',
    unit: 'mmHg',
    normalRange: '70 - 105 mmHg',
    criticalThreshold: '< 65 mmHg (Refractory Septic Hypotension)',
    description: 'Calculated as [DBP + 1/3 (SBP - DBP)]. An essential perfusion endpoint in Sepsis-3 guidelines indicating end-organ vascular hypoperfusion.',
    color: '#f97316',
    referenceLineLow: 65,
    referenceLineHigh: 105,
    decimals: 0,
  },
  sbp: {
    title: 'Systolic Blood Pressure (SBP)',
    unit: 'mmHg',
    normalRange: '90 - 120 mmHg',
    criticalThreshold: '< 90 mmHg (Hypotension) or qSOFA ≤ 100',
    description: 'Peak arterial pressure during cardiac ventricular contraction. Progressive drops reflect microcirculatory vasodilation and hypovolemia.',
    color: '#0284c7',
    referenceLineLow: 90,
    referenceLineHigh: 130,
    decimals: 0,
  },
  dbp: {
    title: 'Diastolic Blood Pressure (DBP)',
    unit: 'mmHg',
    normalRange: '60 - 80 mmHg',
    criticalThreshold: '< 50 mmHg',
    description: 'Resting arterial pressure between cardiac contractions, maintaining coronary perfusion.',
    color: '#6366f1',
    referenceLineLow: 60,
    referenceLineHigh: 85,
    decimals: 0,
  },
  o2sat: {
    title: 'Oxygen Saturation (SpO₂)',
    unit: '%',
    normalRange: '95 - 100 %',
    criticalThreshold: '< 92 % (Acute Hypoxemia)',
    description: 'Pulse oximetric saturation of peripheral hemoglobin. Hypoxemia frequently accompanies ARDS secondary to septic pulmonary capillary leak.',
    color: '#0ea5e9',
    referenceLineLow: 92,
    referenceLineHigh: 100,
    decimals: 0,
  },
  temp: {
    title: 'Body Temperature',
    unit: '°C',
    normalRange: '36.5 - 37.5 °C',
    criticalThreshold: '> 38.3 °C (Hyperthermia) or < 36.0 °C (Hypothermia)',
    description: 'Core body temperature. Hypothermia in elderly septic patients confers a significantly higher mortality risk than fever.',
    color: '#d97706',
    referenceLineLow: 36.0,
    referenceLineHigh: 38.3,
    decimals: 1,
  },
  resp: {
    title: 'Respiratory Rate',
    unit: 'breaths/min',
    normalRange: '12 - 20 bpm',
    criticalThreshold: '≥ 22 bpm (qSOFA criteria)',
    description: 'Spontaneous respiratory frequency. Tachypnea is often the earliest physiological compensation for metabolic lactic acidosis.',
    color: '#8b5cf6',
    referenceLineLow: 12,
    referenceLineHigh: 22,
    decimals: 0,
  },
  etco2: {
    title: 'End-Tidal CO₂ (EtCO₂)',
    unit: 'mmHg',
    normalRange: '35 - 45 mmHg',
    criticalThreshold: '< 25 mmHg (Significant Hypocapnia / Sepsis Alert)',
    description: 'Exhaled carbon dioxide tension measured by capnography. Depressed EtCO2 correlates strongly with elevated serum lactate and metabolic acidosis.',
    color: '#14b8a6',
    referenceLineLow: 25,
    referenceLineHigh: 45,
    decimals: 0,
  },
  shock_index: {
    title: 'Shock Index (HR / SBP)',
    unit: 'ratio',
    normalRange: '0.50 - 0.70',
    criticalThreshold: '≥ 0.90 (Occult Circulatory Collapse)',
    description: 'Ratio of heart rate to systolic blood pressure. Sensitive bedside metric for occult shock preceding overt arterial hypotension.',
    color: '#ef4444',
    referenceLineLow: 0.5,
    referenceLineHigh: 0.9,
    decimals: 2,
  },
  lactate: {
    title: 'Serum Lactate',
    unit: 'mmol/L',
    normalRange: '0.5 - 2.0 mmol/L',
    criticalThreshold: '≥ 2.0 mmol/L (Elevated) or ≥ 4.0 mmol/L (Septic Shock)',
    description: 'Biomarker of tissue hypoperfusion and anaerobic cellular metabolism. Primary cornerstone of Surviving Sepsis Campaign 1-hour resuscitation.',
    color: '#dc2626',
    referenceLineLow: 0.5,
    referenceLineHigh: 2.0,
    decimals: 1,
  },
  wbc: {
    title: 'White Blood Cell Count (WBC)',
    unit: 'k/µL',
    normalRange: '4.5 - 11.0 k/µL',
    criticalThreshold: '> 12.0 k/µL (Leukocytosis) or < 4.0 k/µL (Leukopenia)',
    description: 'Immune cell count responding to microbial invasion. Elevated bandemia or profound leukopenia heralds overwhelming infection.',
    color: '#e11d48',
    referenceLineLow: 4.0,
    referenceLineHigh: 12.0,
    decimals: 1,
  },
  creatinine: {
    title: 'Serum Creatinine',
    unit: 'mg/dL',
    normalRange: '0.7 - 1.3 mg/dL',
    criticalThreshold: '≥ 2.0 mg/dL (Acute Kidney Injury Stage 2/3)',
    description: 'Indicator of glomerular filtration. Sepsis-induced renal hypoperfusion manifests rapidly as oliguria and escalating creatinine.',
    color: '#b45309',
    referenceLineLow: 0.6,
    referenceLineHigh: 1.3,
    decimals: 1,
  },
  platelets: {
    title: 'Platelet Count',
    unit: 'k/µL',
    normalRange: '150 - 450 k/µL',
    criticalThreshold: '< 100 k/µL (Sepsis Coagulopathy / SOFA score)',
    description: 'Thrombocyte count. Rapid consumption reflects microvascular thrombosis and disseminated intravascular coagulation (DIC).',
    color: '#475569',
    referenceLineLow: 100,
    referenceLineHigh: 450,
    decimals: 0,
  },
  glucose: {
    title: 'Serum Glucose',
    unit: 'mg/dL',
    normalRange: '70 - 140 mg/dL',
    criticalThreshold: '> 180 mg/dL (Stress Hyperglycemia)',
    description: 'Circulating glucose driven by sympathetic neuroendocrine stress hormone and cortisol surge.',
    color: '#64748b',
    referenceLineLow: 70,
    referenceLineHigh: 140,
    decimals: 0,
  },
  base_excess: {
    title: 'Arterial Base Excess',
    unit: 'mEq/L',
    normalRange: '-2.0 to +2.0 mEq/L',
    criticalThreshold: '< -4.0 mEq/L (Metabolic Acidemia)',
    description: 'Quantifies metabolic acid-base disturbance. Strongly negative base excess reflects profound lactic acid accumulation.',
    color: '#e11d48',
    referenceLineLow: -4.0,
    referenceLineHigh: 2.0,
    decimals: 1,
  },
};

/**
 * Generates high-fidelity 24-hour historical time-series data for any vital or lab metric
 */
export function generateMetricHistory(
  metricKey: string,
  currentVal: number,
  isCriticalPatient = false
): MetricHistoryModalData {
  const config = METRIC_CONFIGS[metricKey.toLowerCase()] || {
    title: metricKey.toUpperCase(),
    unit: 'units',
    normalRange: 'Normal',
    criticalThreshold: 'Abnormal',
    description: 'Continuous physiological monitoring telemetry stream.',
    color: '#0284c7',
    decimals: 1,
  };

  const hours = 24;
  const history: MetricHistoryItem[] = [];
  const now = Date.now();

  // Baseline start 24 hours ago
  let startValue = isCriticalPatient
    ? currentVal * 0.75 + (config.referenceLineLow || currentVal) * 0.25
    : currentVal * 0.95;

  if (['map', 'sbp', 'dbp', 'o2sat', 'platelets', 'etco2'].includes(metricKey)) {
    // For values that drop during sepsis
    startValue = isCriticalPatient ? currentVal * 1.35 : currentVal * 1.05;
  }

  for (let i = hours; i >= 0; i--) {
    const timeOffsetMs = i * 3600 * 1000;
    const date = new Date(now - timeOffsetMs);
    const timeLabel = `${date.getHours().toString().padStart(2, '0')}:00`;

    // Progressive interpolation with subtle physiological oscillation
    const progress = (hours - i) / hours;
    const noise = (Math.sin(i * 1.4) * 0.04 + Math.cos(i * 2.1) * 0.02);
    let interpolated = startValue + (currentVal - startValue) * progress;
    interpolated = interpolated * (1 + noise);

    if (i === 0) {
      interpolated = currentVal;
    }

    const roundedVal = Number(interpolated.toFixed(config.decimals));

    // Determine status
    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    if (config.referenceLineLow !== undefined && roundedVal < config.referenceLineLow) {
      status = 'CRITICAL';
    } else if (config.referenceLineHigh !== undefined && roundedVal > config.referenceLineHigh) {
      status = 'CRITICAL';
    }

    history.push({
      timestamp: date.toISOString(),
      timeLabel,
      value: roundedVal,
      status,
    });
  }

  return {
    metricKey,
    title: config.title,
    unit: config.unit,
    currentValue: Number(currentVal.toFixed(config.decimals)),
    normalRange: config.normalRange,
    criticalThreshold: config.criticalThreshold,
    description: config.description,
    history,
    color: config.color,
    referenceLineLow: config.referenceLineLow,
    referenceLineHigh: config.referenceLineHigh,
  };
}
