/**
 * CareSense Synthetic Clinical Dataset
 * Clinically authentic, anonymized simulation dataset adhering strictly to ICU sepsis parameters
 */

import {
  Patient,
  VitalSigns,
  LabResult,
  RiskPrediction,
  RiskExplanation,
  Alert,
  TimelineEvent,
  ModelVersion,
  EnrichedPatientData,
} from '../types';

export const INITIAL_MODEL_VERSION: ModelVersion = {
  id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
  model_name: 'CareSense Sepsis Risk Model',
  version: 'v1.0.0',
  status: 'Ready',
  created_at: '2026-03-15T08:00:00Z',
  metrics: {
    auroc: 0.884,
    auprc: 0.742,
    sensitivity: 0.86,
    specificity: 0.83,
    avg_latency_ms: 42,
    predictions_count: 14820,
    last_prediction_time: '2026-09-21T07:01:24Z',
  },
  metadata: {
    framework: 'LightGBM + Temporal Bi-LSTM Ensemble',
    horizon_hours: 6,
    features_count: 34,
    calibration: 'Isotonic Regression',
    model_type: 'Temporal ICU Risk Trajectory Classifier',
  },
};

// 5 Core Simulation Patients
export const CORE_SIMULATION_PATIENTS: Patient[] = [
  {
    id: 'p-1042-uuid',
    patient_code: 'P-1042',
    age: 72,
    gender: 'M',
    icu_bed: 'ICU-02',
    admission_time: '2026-09-19T14:30:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-19T14:30:00Z',
  },
  {
    id: 'p-1024-uuid',
    patient_code: 'P-1024',
    age: 58,
    gender: 'F',
    icu_bed: 'ICU-05',
    admission_time: '2026-09-20T03:15:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-20T03:15:00Z',
  },
  {
    id: 'p-1018-uuid',
    patient_code: 'P-1018',
    age: 64,
    gender: 'M',
    icu_bed: 'ICU-08',
    admission_time: '2026-09-19T06:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-19T06:00:00Z',
  },
  {
    id: 'p-1005-uuid',
    patient_code: 'P-1005',
    age: 45,
    gender: 'F',
    icu_bed: 'ICU-11',
    admission_time: '2026-09-18T10:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'p-1033-uuid',
    patient_code: 'P-1033',
    age: 81,
    gender: 'F',
    icu_bed: 'ICU-04',
    admission_time: '2026-09-20T12:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-20T12:00:00Z',
  },
];

// Additional ICU Ward Patients to meet 24 Monitored Beds
export const ADDITIONAL_WARD_PATIENTS: Patient[] = Array.from({ length: 19 }, (_, i) => {
  const bedNum = (i + 13).toString().padStart(2, '0');
  const codeNum = (1050 + i).toString();
  const ages = [52, 67, 74, 49, 61, 56, 83, 70, 63, 58, 44, 76, 69, 51, 80, 62, 59, 73, 65];
  const genders: ('M' | 'F')[] = ['M', 'F', 'M', 'M', 'F', 'M', 'F', 'F', 'M', 'F', 'M', 'M', 'F', 'F', 'M', 'F', 'M', 'M', 'F'];
  return {
    id: `p-${codeNum}-uuid`,
    patient_code: `P-${codeNum}`,
    age: ages[i] || 65,
    gender: genders[i] || 'M',
    icu_bed: `ICU-${bedNum}`,
    admission_time: '2026-09-19T18:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-19T18:00:00Z',
  };
});

export const ALL_DEMO_PATIENTS: Patient[] = [
  ...CORE_SIMULATION_PATIENTS,
  ...ADDITIONAL_WARD_PATIENTS,
];

// Latest Vitals for Patient 1 (P-1042): Severe Sepsis / Septic Shock
export const VITALS_P1042: VitalSigns = {
  id: 'vit-1042-latest',
  patient_id: 'p-1042-uuid',
  timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  hr: 121,      // BPM - Severe tachycardia (+8%)
  o2sat: 89,    // % - Hypoxemia (-4%)
  temp: 39.0,   // °C - High fever
  sbp: 82,      // mmHg
  map: 52,      // mmHg - Refractory Hypotension (-11%)
  dbp: 37,      // mmHg
  resp: 29,     // Breaths/min - Severe tachypnea
  etco2: 24,    // mmHg - Low EtCO2 indicative of hyperventilation/lactic acidosis
};

export const PREV_VITALS_P1042: VitalSigns = {
  id: 'vit-1042-prev',
  patient_id: 'p-1042-uuid',
  timestamp: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
  hr: 112,
  o2sat: 93,
  temp: 38.4,
  sbp: 95,
  map: 58,
  dbp: 42,
  resp: 24,
  etco2: 27,
};

// Labs for Patient 1 (P-1042)
export const LABS_P1042: LabResult = {
  id: 'lab-1042-latest',
  patient_id: 'p-1042-uuid',
  timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  lactate: 4.2,       // mmol/L - Critical lactic acidosis (Normal < 2.0)
  wbc: 19.4,          // 10^3/uL - Severe leukocytosis
  creatinine: 2.3,    // mg/dL - Acute kidney injury (Baseline 1.1)
  platelets: 98,      // 10^3/uL - Thrombocytopenia consuming
  glucose: 184,       // mg/dL - Stress hyperglycemia
  hgb: 9.8,           // g/dL
  bun: 42,            // mg/dL - Elevated
  base_excess: -6.4,  // Severe metabolic acidemia
  hco3: 17.2,
  fio2: 0.50,
  ph: 7.26,
  paco2: 32,
  sao2: 90,
  ast: 64,
  alkalinephos: 112,
  calcium: 8.1,
  chloride: 104,
  bilirubin_direct: 0.8,
  bilirubin_total: 1.9,
  magnesium: 1.8,
  phosphate: 3.4,
  potassium: 4.9,
  troponini: 0.048,
  hct: 30.2,
  ptt: 44.5,
  fibrinogen: 380,
};

export const PREV_LABS_P1042: LabResult = {
  id: 'lab-1042-prev',
  patient_id: 'p-1042-uuid',
  timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  lactate: 2.6,
  wbc: 14.8,
  creatinine: 1.5,
  platelets: 135,
  glucose: 142,
  hgb: 10.4,
  bun: 28,
  base_excess: -2.8,
};

// 48-Hour Historical Risk Trajectory for P-1042
export const TRAJECTORY_P1042 = [
  { time: 'T-24h', risk: 0.18, tier: 'LOW' as const, lactate: 1.2, map: 78, hr: 82 },
  { time: 'T-20h', risk: 0.22, tier: 'LOW' as const, lactate: 1.4, map: 74, hr: 86 },
  { time: 'T-16h', risk: 0.35, tier: 'WATCH' as const, lactate: 1.7, map: 70, hr: 94 },
  { time: 'T-12h', risk: 0.48, tier: 'WATCH' as const, lactate: 2.1, map: 67, hr: 99 },
  { time: 'T-8h', risk: 0.65, tier: 'ELEVATED' as const, lactate: 2.6, map: 62, hr: 105 },
  { time: 'T-4h', risk: 0.82, tier: 'CRITICAL' as const, lactate: 3.4, map: 58, hr: 112 },
  { time: 'T-2h', risk: 0.89, tier: 'CRITICAL' as const, lactate: 3.9, map: 54, hr: 118 },
  { time: 'Current', risk: 0.94, tier: 'CRITICAL' as const, lactate: 4.2, map: 52, hr: 121 },
];

// SHAP Explanations for P-1042
export const SHAP_P1042: RiskExplanation[] = [
  {
    id: 'shap-1',
    prediction_id: 'pred-1042',
    feature_name: 'Lactate Acceleration (4-hr delta)',
    feature_value: '4.2 mmol/L (+1.6 delta)',
    shap_value: 0.285,
    direction: 'INCREASES_RISK',
    rank: 1,
    clinical_context: 'Rapidly worsening lactic acidemia reflecting systemic tissue hypoperfusion',
  },
  {
    id: 'shap-2',
    prediction_id: 'pred-1042',
    feature_name: 'Mean Arterial Pressure (MAP)',
    feature_value: '52 mmHg (-11% trend)',
    shap_value: 0.242,
    direction: 'INCREASES_RISK',
    rank: 2,
    clinical_context: 'Refractory distributive hypotension below autoregulatory perfusion threshold',
  },
  {
    id: 'shap-3',
    prediction_id: 'pred-1042',
    feature_name: 'Respiratory Rate / SpO2 Ratio',
    feature_value: '29 bpm / 89% SpO2',
    shap_value: 0.187,
    direction: 'INCREASES_RISK',
    rank: 3,
    clinical_context: 'Compensatory tachypnea coupled with refractory gas exchange impairment',
  },
  {
    id: 'shap-4',
    prediction_id: 'pred-1042',
    feature_name: 'WBC Trend & Bandemia',
    feature_value: '19.4 × 10³/µL (+31%)',
    shap_value: 0.134,
    direction: 'INCREASES_RISK',
    rank: 4,
    clinical_context: 'Hyperinflammatory immune response consistent with active septic focus',
  },
  {
    id: 'shap-5',
    prediction_id: 'pred-1042',
    feature_name: 'Acute Creatinine Elevation',
    feature_value: '2.3 mg/dL (AKI Stage 2)',
    shap_value: 0.092,
    direction: 'INCREASES_RISK',
    rank: 5,
    clinical_context: 'Secondary organ dysfunction indicative of Sepsis-3 multiorgan involvement',
  },
  {
    id: 'shap-6',
    prediction_id: 'pred-1042',
    feature_name: 'Platelet Consumption',
    feature_value: '98 × 10³/µL (-37 delta)',
    shap_value: 0.054,
    direction: 'INCREASES_RISK',
    rank: 6,
    clinical_context: 'Early coagulopathy signature / consumable microvascular microthrombi',
  },
];

// Clinical Timeline for P-1042
export const TIMELINE_P1042: TimelineEvent[] = [
  {
    id: 'evt-1',
    patient_id: 'p-1042-uuid',
    timestamp: '10:00 AM',
    event_type: 'VITAL_CHANGE',
    title: 'Routine ICU telemetry synchronised',
    description: 'All 8 vital parameters received from bedside monitor. Baseline stable.',
    severity: 'LOW',
  },
  {
    id: 'evt-2',
    patient_id: 'p-1042-uuid',
    timestamp: '11:00 AM',
    event_type: 'VITAL_CHANGE',
    title: 'MAP decreased to 58 mmHg',
    description: 'Gradual drop in blood pressure noted; fluid bolus 500mL crystalloid commenced.',
    severity: 'WATCH',
  },
  {
    id: 'evt-3',
    patient_id: 'p-1042-uuid',
    timestamp: '12:00 PM',
    event_type: 'RISK_INCREASE',
    title: 'Model-estimated sepsis risk increased to 0.82',
    description: 'CareSense ML temporal trajectory flagged steep lactate and heart rate gradient.',
    severity: 'ELEVATED',
  },
  {
    id: 'evt-4',
    patient_id: 'p-1042-uuid',
    timestamp: '12:05 PM',
    event_type: 'ALERT',
    title: 'CRITICAL Sepsis Early-Warning Alert Triggered',
    description: 'Risk probability reached 0.94. Clinical bundle initiation recommended.',
    severity: 'CRITICAL',
  },
  {
    id: 'evt-5',
    patient_id: 'p-1042-uuid',
    timestamp: '12:07 PM',
    event_type: 'CLINICAL_REVIEW',
    title: 'Attending Intensivist Bedside Review',
    description: 'Dr. Sarah Lin reviewed alert. Blood cultures drawn, empiric broad-spectrum IV piperacillin-tazobactam ordered.',
    severity: 'CRITICAL',
  },
];

// Initial Alerts across ICU ward
export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt-1',
    patient_id: 'p-1042-uuid',
    patient_code: 'P-1042',
    icu_bed: 'ICU-02',
    prediction_id: 'pred-1042',
    alert_type: 'SEPSIS_CRITICAL_ACCELERATION',
    severity: 'CRITICAL',
    message: 'Model-estimated risk increased to 0.94 (MAP 52, Lactate 4.2 mmol/L)',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'alt-2',
    patient_id: 'p-1024-uuid',
    patient_code: 'P-1024',
    icu_bed: 'ICU-05',
    prediction_id: 'pred-1024',
    alert_type: 'RESPIRATORY_DECOMPENSATION',
    severity: 'ELEVATED',
    message: 'SpO₂ decreased to 91% with tachypnea (Resp 27 bpm, Temp 38.8°C)',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'alt-3',
    patient_id: 'p-1033-uuid',
    patient_code: 'P-1033',
    icu_bed: 'ICU-04',
    prediction_id: 'pred-1033',
    alert_type: 'GERIATRIC_BACTEREMIA_SUSPICION',
    severity: 'WATCH',
    message: 'Gradual MAP downward drift (64 mmHg) and baseline WBC elevation (14.8)',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
  },
  {
    id: 'alt-4',
    patient_id: 'p-1018-uuid',
    patient_code: 'P-1018',
    icu_bed: 'ICU-08',
    prediction_id: 'pred-1018',
    alert_type: 'POST_OP_SIRS_EVALUATION',
    severity: 'WATCH',
    message: 'Post-op laparotomy heart rate elevation sustained >98 bpm for 3 hours',
    status: 'ACKNOWLEDGED',
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    acknowledged_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
];

// Helper to assemble full patient dataset
export function buildEnrichedPatient(patient: Patient, index = 0): EnrichedPatientData {
  if (patient.patient_code === 'P-1042') {
    return {
      patient,
      latestVitals: VITALS_P1042,
      previousVitals: PREV_VITALS_P1042,
      latestLabs: LABS_P1042,
      previousLabs: PREV_LABS_P1042,
      currentPrediction: {
        id: 'pred-1042',
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        risk_probability: 0.94,
        risk_tier: 'CRITICAL',
        risk_status: 'ELEVATED_MORTALITY_RISK',
        model_version: 'v1.0.0',
        prediction_horizon: '6H',
        previous_probability: 0.82,
        change: 0.12,
      },
      riskHistory: TRAJECTORY_P1042,
      explanations: SHAP_P1042,
      activeAlerts: INITIAL_ALERTS.filter(a => a.patient_id === patient.id),
      recentTimeline: TIMELINE_P1042,
    };
  }

  if (patient.patient_code === 'P-1024') {
    return {
      patient,
      latestVitals: {
        id: `vit-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        hr: 108,
        o2sat: 91,
        temp: 38.8,
        sbp: 96,
        map: 63,
        dbp: 46,
        resp: 27,
        etco2: 28,
      },
      previousVitals: {
        id: `vit-prev-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        hr: 96,
        o2sat: 95,
        temp: 37.9,
        sbp: 108,
        map: 71,
        dbp: 52,
        resp: 21,
        etco2: 32,
      },
      latestLabs: {
        id: `lab-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
        lactate: 2.8,
        wbc: 16.2,
        creatinine: 1.6,
        platelets: 175,
        glucose: 156,
        hgb: 11.2,
        bun: 26,
        base_excess: -3.5,
        hco3: 19.5,
        ph: 7.32,
      },
      currentPrediction: {
        id: `pred-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        risk_probability: 0.74,
        risk_tier: 'ELEVATED',
        risk_status: 'RAPID_DECOMPENSATION',
        model_version: 'v1.0.0',
        prediction_horizon: '6H',
        previous_probability: 0.58,
        change: 0.16,
      },
      riskHistory: [
        { time: 'T-24h', risk: 0.14, tier: 'LOW' as const },
        { time: 'T-18h', risk: 0.20, tier: 'LOW' as const },
        { time: 'T-12h', risk: 0.32, tier: 'WATCH' as const },
        { time: 'T-6h', risk: 0.45, tier: 'WATCH' as const },
        { time: 'T-2h', risk: 0.58, tier: 'WATCH' as const },
        { time: 'Current', risk: 0.74, tier: 'ELEVATED' as const },
      ],
      explanations: [
        {
          id: 'shap-201',
          prediction_id: `pred-${patient.id}`,
          feature_name: 'SpO2 Desaturation Trend',
          feature_value: '91% (-4% in 1h)',
          shap_value: 0.21,
          direction: 'INCREASES_RISK',
          rank: 1,
        },
        {
          id: 'shap-202',
          prediction_id: `pred-${patient.id}`,
          feature_name: 'Tachypnea (Resp Rate)',
          feature_value: '27 bpm (+6 delta)',
          shap_value: 0.18,
          direction: 'INCREASES_RISK',
          rank: 2,
        },
        {
          id: 'shap-203',
          prediction_id: `pred-${patient.id}`,
          feature_name: 'Serum Lactate Elevation',
          feature_value: '2.8 mmol/L',
          shap_value: 0.15,
          direction: 'INCREASES_RISK',
          rank: 3,
        },
      ],
      activeAlerts: INITIAL_ALERTS.filter(a => a.patient_id === patient.id),
      recentTimeline: [
        {
          id: 'evt-201',
          patient_id: patient.id,
          timestamp: '11:30 AM',
          event_type: 'VITAL_CHANGE',
          title: 'Oxygen saturation decrease noted',
          description: 'Nasal cannula increased to 4L/min. Arterial blood gas ordered.',
          severity: 'ELEVATED',
        },
      ],
    };
  }

  if (patient.patient_code === 'P-1018') {
    return {
      patient,
      latestVitals: {
        id: `vit-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        hr: 98,
        o2sat: 96,
        temp: 38.1,
        sbp: 110,
        map: 68,
        dbp: 47,
        resp: 21,
        etco2: 34,
      },
      latestLabs: {
        id: `lab-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        lactate: 1.8,
        wbc: 13.5,
        creatinine: 1.2,
        platelets: 210,
        glucose: 134,
        hgb: 12.0,
        bun: 19,
      },
      currentPrediction: {
        id: `pred-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        risk_probability: 0.46,
        risk_tier: 'WATCH',
        risk_status: 'POST_OP_MONITORING',
        model_version: 'v1.0.0',
        prediction_horizon: '6H',
        previous_probability: 0.42,
        change: 0.04,
      },
      riskHistory: [
        { time: 'T-24h', risk: 0.35, tier: 'WATCH' as const },
        { time: 'T-18h', risk: 0.38, tier: 'WATCH' as const },
        { time: 'T-12h', risk: 0.40, tier: 'WATCH' as const },
        { time: 'T-6h', risk: 0.42, tier: 'WATCH' as const },
        { time: 'Current', risk: 0.46, tier: 'WATCH' as const },
      ],
      explanations: [
        {
          id: 'shap-301',
          prediction_id: `pred-${patient.id}`,
          feature_name: 'Post-op Heart Rate Drift',
          feature_value: '98 bpm (borderline)',
          shap_value: 0.12,
          direction: 'INCREASES_RISK',
          rank: 1,
        },
        {
          id: 'shap-302',
          prediction_id: `pred-${patient.id}`,
          feature_name: 'WBC Count Elevation',
          feature_value: '13.5 × 10³/µL',
          shap_value: 0.09,
          direction: 'INCREASES_RISK',
          rank: 2,
        },
      ],
      activeAlerts: INITIAL_ALERTS.filter(a => a.patient_id === patient.id),
      recentTimeline: [],
    };
  }

  if (patient.patient_code === 'P-1005') {
    return {
      patient,
      latestVitals: {
        id: `vit-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        hr: 74,
        o2sat: 98,
        temp: 36.8,
        sbp: 122,
        map: 82,
        dbp: 62,
        resp: 16,
        etco2: 38,
      },
      latestLabs: {
        id: `lab-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        lactate: 1.1,
        wbc: 7.2,
        creatinine: 0.9,
        platelets: 245,
        glucose: 104,
        hgb: 13.5,
        bun: 14,
      },
      currentPrediction: {
        id: `pred-${patient.id}`,
        patient_id: patient.id,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        risk_probability: 0.12,
        risk_tier: 'LOW',
        risk_status: 'RECOVERY_HEMODYNAMICALLY_STABLE',
        model_version: 'v1.0.0',
        prediction_horizon: '6H',
        previous_probability: 0.18,
        change: -0.06,
      },
      riskHistory: [
        { time: 'T-24h', risk: 0.38, tier: 'WATCH' as const },
        { time: 'T-18h', risk: 0.29, tier: 'LOW' as const },
        { time: 'T-12h', risk: 0.22, tier: 'LOW' as const },
        { time: 'T-6h', risk: 0.18, tier: 'LOW' as const },
        { time: 'Current', risk: 0.12, tier: 'LOW' as const },
      ],
      explanations: [
        {
          id: 'shap-401',
          prediction_id: `pred-${patient.id}`,
          feature_name: 'Normal Serum Lactate',
          feature_value: '1.1 mmol/L',
          shap_value: -0.22,
          direction: 'DECREASES_RISK',
          rank: 1,
        },
        {
          id: 'shap-402',
          prediction_id: `pred-${patient.id}`,
          feature_name: 'Adequate Mean Arterial Pressure',
          feature_value: '82 mmHg',
          shap_value: -0.19,
          direction: 'DECREASES_RISK',
          rank: 2,
        },
      ],
      activeAlerts: [],
      recentTimeline: [],
    };
  }

  // Default generation for others
  const risks = [0.15, 0.22, 0.34, 0.48, 0.52, 0.18, 0.25, 0.39, 0.61, 0.19, 0.28, 0.41, 0.16, 0.23, 0.31, 0.54, 0.21, 0.17, 0.29];
  const r = risks[index % risks.length] || 0.25;
  const tier: 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL' = 
    r >= 0.8 ? 'CRITICAL' : r >= 0.6 ? 'ELEVATED' : r >= 0.3 ? 'WATCH' : 'LOW';

  return {
    patient,
    latestVitals: {
      id: `vit-${patient.id}`,
      patient_id: patient.id,
      timestamp: new Date(Date.now() - (index + 2) * 8 * 60 * 1000).toISOString(),
      hr: Math.round(72 + (r * 35)),
      o2sat: Math.round(98 - (r * 8)),
      temp: Number((36.8 + (r * 2.1)).toFixed(1)),
      sbp: Math.round(120 - (r * 30)),
      map: Math.round(85 - (r * 26)),
      dbp: Math.round(65 - (r * 20)),
      resp: Math.round(16 + (r * 12)),
      etco2: Math.round(38 - (r * 10)),
    },
    latestLabs: {
      id: `lab-${patient.id}`,
      patient_id: patient.id,
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      lactate: Number((1.1 + (r * 2.5)).toFixed(1)),
      wbc: Number((7.0 + (r * 11)).toFixed(1)),
      creatinine: Number((0.9 + (r * 1.1)).toFixed(2)),
      platelets: Math.round(260 - (r * 120)),
      glucose: Math.round(110 + (r * 60)),
      hgb: 12.8,
      bun: Math.round(15 + (r * 20)),
    },
    currentPrediction: {
      id: `pred-${patient.id}`,
      patient_id: patient.id,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      risk_probability: Number(r.toFixed(2)),
      risk_tier: tier,
      risk_status: 'MONITORING',
      model_version: 'v1.0.0',
      prediction_horizon: '6H',
      previous_probability: Number((r - 0.03).toFixed(2)),
      change: 0.03,
    },
    riskHistory: [
      { time: 'T-18h', risk: Number((r * 0.7).toFixed(2)), tier: 'LOW' as const },
      { time: 'T-12h', risk: Number((r * 0.8).toFixed(2)), tier: 'LOW' as const },
      { time: 'T-6h', risk: Number((r * 0.9).toFixed(2)), tier: 'WATCH' as const },
      { time: 'Current', risk: Number(r.toFixed(2)), tier },
    ],
    explanations: [
      {
        id: `shap-${patient.id}-1`,
        prediction_id: `pred-${patient.id}`,
        feature_name: 'Telemetry Stability Index',
        feature_value: 'Baseline normal',
        shap_value: tier === 'LOW' ? -0.15 : 0.08,
        direction: tier === 'LOW' ? 'DECREASES_RISK' : 'INCREASES_RISK',
        rank: 1,
      },
    ],
    activeAlerts: [],
    recentTimeline: [],
  };
}
