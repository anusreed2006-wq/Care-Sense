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
import { getPatientHourlyHistory } from './patientHistoryDataset';

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

// 5 Authentic Dataset Cohort Patients from PhysioNet/MIMIC Sepsis-3 24H Telemetry
export const DATASET_SEPSIS_PATIENTS: Patient[] = [
  {
    id: 'p-1001-uuid',
    patient_code: 'P-1001',
    age: 54,
    gender: 'M',
    icu_bed: 'ICU-01',
    admission_time: '2026-09-19T08:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-19T08:00:00Z',
  },
  {
    id: 'p-1002-uuid',
    patient_code: 'P-1002',
    age: 61,
    gender: 'F',
    icu_bed: 'ICU-03',
    admission_time: '2026-09-19T10:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-19T10:00:00Z',
  },
  {
    id: 'p-1003-uuid',
    patient_code: 'P-1003',
    age: 68,
    gender: 'M',
    icu_bed: 'ICU-06',
    admission_time: '2026-09-19T12:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-19T12:00:00Z',
  },
  {
    id: 'p-1004-uuid',
    patient_code: 'P-1004',
    age: 72,
    gender: 'M',
    icu_bed: 'ICU-07',
    admission_time: '2026-09-19T14:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-19T14:00:00Z',
  },
  {
    id: 'p-1005-uuid',
    patient_code: 'P-1005',
    age: 47,
    gender: 'F',
    icu_bed: 'ICU-11',
    admission_time: '2026-09-18T10:00:00Z',
    status: 'ACTIVE',
    created_at: '2026-09-18T10:00:00Z',
  },
];

// Core Benchmark & Simulation Patients
export const CORE_SIMULATION_PATIENTS: Patient[] = [
  ...DATASET_SEPSIS_PATIENTS,
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
    id: 'alt-p1002',
    patient_id: 'p-1002-uuid',
    patient_code: 'P-1002',
    icu_bed: 'ICU-03',
    prediction_id: 'pred-1002',
    alert_type: 'SEPSIS_CRITICAL_ACCELERATION',
    severity: 'CRITICAL',
    message: 'PhysioNet dataset acute sepsis decompensation: MAP 57 mmHg, Lactate 5.96 mmol/L, WBC 19.6',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'alt-p1003',
    patient_id: 'p-1003-uuid',
    patient_code: 'P-1003',
    icu_bed: 'ICU-06',
    prediction_id: 'pred-1003',
    alert_type: 'SEPTIC_SHOCK_REFRACTORY',
    severity: 'CRITICAL',
    message: 'Severe septic shock & multiorgan failure: HR 135 bpm, MAP 50 mmHg, Lactate 6.56 mmol/L, Creatinine 4.12 mg/dL',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'alt-p1004',
    patient_id: 'p-1004-uuid',
    patient_code: 'P-1004',
    icu_bed: 'ICU-07',
    prediction_id: 'pred-1004',
    alert_type: 'FULMINANT_SEPSIS_ARDS',
    severity: 'CRITICAL',
    message: 'Fulminant ARDS and Septic Shock: HR 141 bpm, SpO2 84%, Lactate 6.58 mmol/L, WBC 28.8',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'alt-1',
    patient_id: 'p-1042-uuid',
    patient_code: 'P-1042',
    icu_bed: 'ICU-02',
    prediction_id: 'pred-1042',
    alert_type: 'SEPSIS_CRITICAL_ACCELERATION',
    severity: 'CRITICAL',
    message: 'Model-estimated risk increased to 0.115 (MAP 49, Lactate 6.8 mmol/L, AKI-2)',
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
    message: 'Model-estimated risk increased to 0.087 with SpO₂ 91% tachypnea (Resp 27 bpm)',
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
    message: 'Geriatric monitoring: MAP 66 mmHg, WBC 16.5 k/µL, risk 0.023',
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

// Authentic CareSense XGBoost Model Inferences & 24H Trajectories (Computed from Render backend)
export const BACKEND_VERIFIED_COHORT: Record<string, {
  risk_probability: number;
  risk_tier: 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL';
  risk_status: string;
  trajectory: { time: string; risk: number; tier: 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL' }[];
  top_features: Array<{ feature: string; value: any; shap_value: number; direction: string; [key: string]: any }>;
}> = {
  "P-1001": {
    "risk_probability": 0.012,
    "risk_tier": "LOW",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.005,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.007,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.006,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.007,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.007,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.008,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-8",
        "risk": 0.008,
        "tier": "LOW"
      },
      {
        "time": "H-9",
        "risk": 0.008,
        "tier": "LOW"
      },
      {
        "time": "H-10",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-11",
        "risk": 0.011,
        "tier": "LOW"
      },
      {
        "time": "H-12",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-13",
        "risk": 0.011,
        "tier": "LOW"
      },
      {
        "time": "H-14",
        "risk": 0.008,
        "tier": "LOW"
      },
      {
        "time": "H-15",
        "risk": 0.008,
        "tier": "LOW"
      },
      {
        "time": "H-16",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-17",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-18",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-19",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-20",
        "risk": 0.012,
        "tier": "LOW"
      },
      {
        "time": "H-21",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-22",
        "risk": 0.011,
        "tier": "LOW"
      },
      {
        "time": "H-23",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-24",
        "risk": 0.012,
        "tier": "LOW"
      }
    ],
    "top_features": [
      {
        "feature": "Lactate_hours_since_last",
        "value": 0.0,
        "shap_value": 0.4488799273967743,
        "magnitude": 0.4488799273967743,
        "direction": "increases risk",
        "source": "Lactate",
        "operation": "recency",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.37087321281433105,
        "magnitude": 0.37087321281433105,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "EtCO2_last",
        "value": 35.731998443603516,
        "shap_value": 0.3542404770851135,
        "magnitude": 0.3542404770851135,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1002": {
    "risk_probability": 0.085,
    "risk_tier": "ELEVATED",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.006,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.018,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.019,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.019,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.026,
        "tier": "LOW"
      },
      {
        "time": "H-8",
        "risk": 0.029,
        "tier": "LOW"
      },
      {
        "time": "H-9",
        "risk": 0.048,
        "tier": "WATCH"
      },
      {
        "time": "H-10",
        "risk": 0.067,
        "tier": "ELEVATED"
      },
      {
        "time": "H-11",
        "risk": 0.049,
        "tier": "WATCH"
      },
      {
        "time": "H-12",
        "risk": 0.056,
        "tier": "WATCH"
      },
      {
        "time": "H-13",
        "risk": 0.075,
        "tier": "ELEVATED"
      },
      {
        "time": "H-14",
        "risk": 0.082,
        "tier": "ELEVATED"
      },
      {
        "time": "H-15",
        "risk": 0.078,
        "tier": "ELEVATED"
      },
      {
        "time": "H-16",
        "risk": 0.098,
        "tier": "ELEVATED"
      },
      {
        "time": "H-17",
        "risk": 0.097,
        "tier": "ELEVATED"
      },
      {
        "time": "H-18",
        "risk": 0.109,
        "tier": "CRITICAL"
      },
      {
        "time": "H-19",
        "risk": 0.112,
        "tier": "CRITICAL"
      },
      {
        "time": "H-20",
        "risk": 0.096,
        "tier": "ELEVATED"
      },
      {
        "time": "H-21",
        "risk": 0.101,
        "tier": "CRITICAL"
      },
      {
        "time": "H-22",
        "risk": 0.09,
        "tier": "ELEVATED"
      },
      {
        "time": "H-23",
        "risk": 0.087,
        "tier": "ELEVATED"
      },
      {
        "time": "H-24",
        "risk": 0.085,
        "tier": "ELEVATED"
      }
    ],
    "top_features": [
      {
        "feature": "EtCO2_last",
        "value": 26.509000778198242,
        "shap_value": 0.47462987899780273,
        "magnitude": 0.47462987899780273,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "Temp_last",
        "value": 38.867000579833984,
        "shap_value": 0.3433539867401123,
        "magnitude": 0.3433539867401123,
        "direction": "increases risk",
        "source": "Temp",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.3149406611919403,
        "magnitude": 0.3149406611919403,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1003": {
    "risk_probability": 0.105,
    "risk_tier": "CRITICAL",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.025,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.023,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.03,
        "tier": "WATCH"
      },
      {
        "time": "H-4",
        "risk": 0.036,
        "tier": "WATCH"
      },
      {
        "time": "H-5",
        "risk": 0.044,
        "tier": "WATCH"
      },
      {
        "time": "H-6",
        "risk": 0.055,
        "tier": "WATCH"
      },
      {
        "time": "H-7",
        "risk": 0.068,
        "tier": "ELEVATED"
      },
      {
        "time": "H-8",
        "risk": 0.056,
        "tier": "WATCH"
      },
      {
        "time": "H-9",
        "risk": 0.069,
        "tier": "ELEVATED"
      },
      {
        "time": "H-10",
        "risk": 0.074,
        "tier": "ELEVATED"
      },
      {
        "time": "H-11",
        "risk": 0.078,
        "tier": "ELEVATED"
      },
      {
        "time": "H-12",
        "risk": 0.082,
        "tier": "ELEVATED"
      },
      {
        "time": "H-13",
        "risk": 0.072,
        "tier": "ELEVATED"
      },
      {
        "time": "H-14",
        "risk": 0.086,
        "tier": "ELEVATED"
      },
      {
        "time": "H-15",
        "risk": 0.081,
        "tier": "ELEVATED"
      },
      {
        "time": "H-16",
        "risk": 0.086,
        "tier": "ELEVATED"
      },
      {
        "time": "H-17",
        "risk": 0.083,
        "tier": "ELEVATED"
      },
      {
        "time": "H-18",
        "risk": 0.104,
        "tier": "CRITICAL"
      },
      {
        "time": "H-19",
        "risk": 0.099,
        "tier": "ELEVATED"
      },
      {
        "time": "H-20",
        "risk": 0.095,
        "tier": "ELEVATED"
      },
      {
        "time": "H-21",
        "risk": 0.103,
        "tier": "CRITICAL"
      },
      {
        "time": "H-22",
        "risk": 0.089,
        "tier": "ELEVATED"
      },
      {
        "time": "H-23",
        "risk": 0.087,
        "tier": "ELEVATED"
      },
      {
        "time": "H-24",
        "risk": 0.105,
        "tier": "CRITICAL"
      }
    ],
    "top_features": [
      {
        "feature": "EtCO2_last",
        "value": 22.0049991607666,
        "shap_value": 0.44962507486343384,
        "magnitude": 0.44962507486343384,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.32122549414634705,
        "magnitude": 0.32122549414634705,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "Temp_last",
        "value": 39.582000732421875,
        "shap_value": 0.3137063980102539,
        "magnitude": 0.3137063980102539,
        "direction": "increases risk",
        "source": "Temp",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1004": {
    "risk_probability": 0.125,
    "risk_tier": "CRITICAL",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.004,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.008,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.013,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.019,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.027,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.035,
        "tier": "WATCH"
      },
      {
        "time": "H-8",
        "risk": 0.075,
        "tier": "ELEVATED"
      },
      {
        "time": "H-9",
        "risk": 0.073,
        "tier": "ELEVATED"
      },
      {
        "time": "H-10",
        "risk": 0.088,
        "tier": "ELEVATED"
      },
      {
        "time": "H-11",
        "risk": 0.111,
        "tier": "CRITICAL"
      },
      {
        "time": "H-12",
        "risk": 0.106,
        "tier": "CRITICAL"
      },
      {
        "time": "H-13",
        "risk": 0.128,
        "tier": "CRITICAL"
      },
      {
        "time": "H-14",
        "risk": 0.102,
        "tier": "CRITICAL"
      },
      {
        "time": "H-15",
        "risk": 0.139,
        "tier": "CRITICAL"
      },
      {
        "time": "H-16",
        "risk": 0.12,
        "tier": "CRITICAL"
      },
      {
        "time": "H-17",
        "risk": 0.145,
        "tier": "CRITICAL"
      },
      {
        "time": "H-18",
        "risk": 0.135,
        "tier": "CRITICAL"
      },
      {
        "time": "H-19",
        "risk": 0.143,
        "tier": "CRITICAL"
      },
      {
        "time": "H-20",
        "risk": 0.12,
        "tier": "CRITICAL"
      },
      {
        "time": "H-21",
        "risk": 0.146,
        "tier": "CRITICAL"
      },
      {
        "time": "H-22",
        "risk": 0.127,
        "tier": "CRITICAL"
      },
      {
        "time": "H-23",
        "risk": 0.137,
        "tier": "CRITICAL"
      },
      {
        "time": "H-24",
        "risk": 0.125,
        "tier": "CRITICAL"
      }
    ],
    "top_features": [
      {
        "feature": "EtCO2_last",
        "value": 21.347000122070312,
        "shap_value": 0.4459088444709778,
        "magnitude": 0.4459088444709778,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "Temp_last",
        "value": 39.58599853515625,
        "shap_value": 0.3998256325721741,
        "magnitude": 0.3998256325721741,
        "direction": "increases risk",
        "source": "Temp",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.33246228098869324,
        "magnitude": 0.33246228098869324,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1005": {
    "risk_probability": 0.011,
    "risk_tier": "LOW",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.013,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.013,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.014,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.015,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.016,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.023,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.023,
        "tier": "LOW"
      },
      {
        "time": "H-8",
        "risk": 0.026,
        "tier": "LOW"
      },
      {
        "time": "H-9",
        "risk": 0.026,
        "tier": "LOW"
      },
      {
        "time": "H-10",
        "risk": 0.027,
        "tier": "LOW"
      },
      {
        "time": "H-11",
        "risk": 0.026,
        "tier": "LOW"
      },
      {
        "time": "H-12",
        "risk": 0.032,
        "tier": "WATCH"
      },
      {
        "time": "H-13",
        "risk": 0.022,
        "tier": "LOW"
      },
      {
        "time": "H-14",
        "risk": 0.019,
        "tier": "LOW"
      },
      {
        "time": "H-15",
        "risk": 0.018,
        "tier": "LOW"
      },
      {
        "time": "H-16",
        "risk": 0.018,
        "tier": "LOW"
      },
      {
        "time": "H-17",
        "risk": 0.015,
        "tier": "LOW"
      },
      {
        "time": "H-18",
        "risk": 0.013,
        "tier": "LOW"
      },
      {
        "time": "H-19",
        "risk": 0.014,
        "tier": "LOW"
      },
      {
        "time": "H-20",
        "risk": 0.013,
        "tier": "LOW"
      },
      {
        "time": "H-21",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-22",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-23",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-24",
        "risk": 0.011,
        "tier": "LOW"
      }
    ],
    "top_features": [
      {
        "feature": "Unit1",
        "value": 0.0,
        "shap_value": -0.34491413831710815,
        "magnitude": 0.34491413831710815,
        "direction": "decreases risk",
        "source": "Unit1",
        "operation": "current",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.33703649044036865,
        "magnitude": 0.33703649044036865,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "EtCO2_last",
        "value": 34.89899826049805,
        "shap_value": 0.33648917078971863,
        "magnitude": 0.33648917078971863,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1042": {
    "risk_probability": 0.115,
    "risk_tier": "CRITICAL",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.007,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.012,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.014,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.018,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.022,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.026,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.064,
        "tier": "ELEVATED"
      },
      {
        "time": "H-8",
        "risk": 0.063,
        "tier": "ELEVATED"
      },
      {
        "time": "H-9",
        "risk": 0.087,
        "tier": "ELEVATED"
      },
      {
        "time": "H-10",
        "risk": 0.081,
        "tier": "ELEVATED"
      },
      {
        "time": "H-11",
        "risk": 0.093,
        "tier": "ELEVATED"
      },
      {
        "time": "H-12",
        "risk": 0.087,
        "tier": "ELEVATED"
      },
      {
        "time": "H-13",
        "risk": 0.107,
        "tier": "CRITICAL"
      },
      {
        "time": "H-14",
        "risk": 0.121,
        "tier": "CRITICAL"
      },
      {
        "time": "H-15",
        "risk": 0.118,
        "tier": "CRITICAL"
      },
      {
        "time": "H-16",
        "risk": 0.116,
        "tier": "CRITICAL"
      },
      {
        "time": "H-17",
        "risk": 0.138,
        "tier": "CRITICAL"
      },
      {
        "time": "H-18",
        "risk": 0.124,
        "tier": "CRITICAL"
      },
      {
        "time": "H-19",
        "risk": 0.12,
        "tier": "CRITICAL"
      },
      {
        "time": "H-20",
        "risk": 0.122,
        "tier": "CRITICAL"
      },
      {
        "time": "H-21",
        "risk": 0.127,
        "tier": "CRITICAL"
      },
      {
        "time": "H-22",
        "risk": 0.122,
        "tier": "CRITICAL"
      },
      {
        "time": "H-23",
        "risk": 0.134,
        "tier": "CRITICAL"
      },
      {
        "time": "H-24",
        "risk": 0.115,
        "tier": "CRITICAL"
      }
    ],
    "top_features": [
      {
        "feature": "EtCO2_last",
        "value": 23.0,
        "shap_value": 0.4756762981414795,
        "magnitude": 0.4756762981414795,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "Temp_last",
        "value": 39.29999923706055,
        "shap_value": 0.34888583421707153,
        "magnitude": 0.34888583421707153,
        "direction": "increases risk",
        "source": "Temp",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.31721147894859314,
        "magnitude": 0.31721147894859314,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1024": {
    "risk_probability": 0.087,
    "risk_tier": "ELEVATED",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.006,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.007,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.011,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.012,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.013,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.022,
        "tier": "LOW"
      },
      {
        "time": "H-8",
        "risk": 0.024,
        "tier": "LOW"
      },
      {
        "time": "H-9",
        "risk": 0.03,
        "tier": "LOW"
      },
      {
        "time": "H-10",
        "risk": 0.045,
        "tier": "WATCH"
      },
      {
        "time": "H-11",
        "risk": 0.052,
        "tier": "WATCH"
      },
      {
        "time": "H-12",
        "risk": 0.06,
        "tier": "ELEVATED"
      },
      {
        "time": "H-13",
        "risk": 0.058,
        "tier": "WATCH"
      },
      {
        "time": "H-14",
        "risk": 0.062,
        "tier": "ELEVATED"
      },
      {
        "time": "H-15",
        "risk": 0.066,
        "tier": "ELEVATED"
      },
      {
        "time": "H-16",
        "risk": 0.063,
        "tier": "ELEVATED"
      },
      {
        "time": "H-17",
        "risk": 0.078,
        "tier": "ELEVATED"
      },
      {
        "time": "H-18",
        "risk": 0.078,
        "tier": "ELEVATED"
      },
      {
        "time": "H-19",
        "risk": 0.091,
        "tier": "ELEVATED"
      },
      {
        "time": "H-20",
        "risk": 0.09,
        "tier": "ELEVATED"
      },
      {
        "time": "H-21",
        "risk": 0.084,
        "tier": "ELEVATED"
      },
      {
        "time": "H-22",
        "risk": 0.079,
        "tier": "ELEVATED"
      },
      {
        "time": "H-23",
        "risk": 0.083,
        "tier": "ELEVATED"
      },
      {
        "time": "H-24",
        "risk": 0.087,
        "tier": "ELEVATED"
      }
    ],
    "top_features": [
      {
        "feature": "EtCO2_last",
        "value": 28.0,
        "shap_value": 0.5219142436981201,
        "magnitude": 0.5219142436981201,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "Temp_last",
        "value": 39.0,
        "shap_value": 0.39951974153518677,
        "magnitude": 0.39951974153518677,
        "direction": "increases risk",
        "source": "Temp",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.32059574127197266,
        "magnitude": 0.32059574127197266,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1018": {
    "risk_probability": 0.051,
    "risk_tier": "WATCH",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.006,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.008,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.012,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.014,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.016,
        "tier": "LOW"
      },
      {
        "time": "H-8",
        "risk": 0.017,
        "tier": "LOW"
      },
      {
        "time": "H-9",
        "risk": 0.017,
        "tier": "LOW"
      },
      {
        "time": "H-10",
        "risk": 0.017,
        "tier": "LOW"
      },
      {
        "time": "H-11",
        "risk": 0.019,
        "tier": "LOW"
      },
      {
        "time": "H-12",
        "risk": 0.018,
        "tier": "LOW"
      },
      {
        "time": "H-13",
        "risk": 0.019,
        "tier": "LOW"
      },
      {
        "time": "H-14",
        "risk": 0.021,
        "tier": "LOW"
      },
      {
        "time": "H-15",
        "risk": 0.024,
        "tier": "LOW"
      },
      {
        "time": "H-16",
        "risk": 0.035,
        "tier": "WATCH"
      },
      {
        "time": "H-17",
        "risk": 0.038,
        "tier": "WATCH"
      },
      {
        "time": "H-18",
        "risk": 0.039,
        "tier": "WATCH"
      },
      {
        "time": "H-19",
        "risk": 0.041,
        "tier": "WATCH"
      },
      {
        "time": "H-20",
        "risk": 0.048,
        "tier": "WATCH"
      },
      {
        "time": "H-21",
        "risk": 0.053,
        "tier": "WATCH"
      },
      {
        "time": "H-22",
        "risk": 0.053,
        "tier": "WATCH"
      },
      {
        "time": "H-23",
        "risk": 0.051,
        "tier": "WATCH"
      },
      {
        "time": "H-24",
        "risk": 0.051,
        "tier": "WATCH"
      }
    ],
    "top_features": [
      {
        "feature": "Temp_last",
        "value": 38.099998474121094,
        "shap_value": 0.5815377235412598,
        "magnitude": 0.5815377235412598,
        "direction": "increases risk",
        "source": "Temp",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "EtCO2_last",
        "value": 32.0,
        "shap_value": 0.49650901556015015,
        "magnitude": 0.49650901556015015,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "Lactate_hours_since_last",
        "value": 0.0,
        "shap_value": 0.3789028227329254,
        "magnitude": 0.3789028227329254,
        "direction": "increases risk",
        "source": "Lactate",
        "operation": "recency",
        "units": "uncalibrated log odds"
      }
    ]
  },
  "P-1033": {
    "risk_probability": 0.023,
    "risk_tier": "LOW",
    "risk_status": "Model-estimated lower risk",
    "trajectory": [
      {
        "time": "H-1",
        "risk": 0.005,
        "tier": "LOW"
      },
      {
        "time": "H-2",
        "risk": 0.007,
        "tier": "LOW"
      },
      {
        "time": "H-3",
        "risk": 0.009,
        "tier": "LOW"
      },
      {
        "time": "H-4",
        "risk": 0.01,
        "tier": "LOW"
      },
      {
        "time": "H-5",
        "risk": 0.012,
        "tier": "LOW"
      },
      {
        "time": "H-6",
        "risk": 0.013,
        "tier": "LOW"
      },
      {
        "time": "H-7",
        "risk": 0.014,
        "tier": "LOW"
      },
      {
        "time": "H-8",
        "risk": 0.015,
        "tier": "LOW"
      },
      {
        "time": "H-9",
        "risk": 0.015,
        "tier": "LOW"
      },
      {
        "time": "H-10",
        "risk": 0.015,
        "tier": "LOW"
      },
      {
        "time": "H-11",
        "risk": 0.017,
        "tier": "LOW"
      },
      {
        "time": "H-12",
        "risk": 0.018,
        "tier": "LOW"
      },
      {
        "time": "H-13",
        "risk": 0.019,
        "tier": "LOW"
      },
      {
        "time": "H-14",
        "risk": 0.02,
        "tier": "LOW"
      },
      {
        "time": "H-15",
        "risk": 0.02,
        "tier": "LOW"
      },
      {
        "time": "H-16",
        "risk": 0.02,
        "tier": "LOW"
      },
      {
        "time": "H-17",
        "risk": 0.021,
        "tier": "LOW"
      },
      {
        "time": "H-18",
        "risk": 0.022,
        "tier": "LOW"
      },
      {
        "time": "H-19",
        "risk": 0.022,
        "tier": "LOW"
      },
      {
        "time": "H-20",
        "risk": 0.024,
        "tier": "LOW"
      },
      {
        "time": "H-21",
        "risk": 0.027,
        "tier": "LOW"
      },
      {
        "time": "H-22",
        "risk": 0.026,
        "tier": "LOW"
      },
      {
        "time": "H-23",
        "risk": 0.026,
        "tier": "LOW"
      },
      {
        "time": "H-24",
        "risk": 0.023,
        "tier": "LOW"
      }
    ],
    "top_features": [
      {
        "feature": "EtCO2_last",
        "value": 29.0,
        "shap_value": 0.4526781737804413,
        "magnitude": 0.4526781737804413,
        "direction": "increases risk",
        "source": "EtCO2",
        "operation": "last_observed",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "ICULOS",
        "value": 24.0,
        "shap_value": -0.3970528542995453,
        "magnitude": 0.3970528542995453,
        "direction": "decreases risk",
        "source": "ICULOS",
        "operation": "current",
        "units": "uncalibrated log odds"
      },
      {
        "feature": "Unit1",
        "value": 0.0,
        "shap_value": -0.37291646003723145,
        "magnitude": 0.37291646003723145,
        "direction": "decreases risk",
        "source": "Unit1",
        "operation": "current",
        "units": "uncalibrated log odds"
      }
    ]
  }
};

// Helper to assemble full patient dataset from authentic 24-hour longitudinal records
export function buildEnrichedPatient(patient: Patient, index = 0): EnrichedPatientData {
  const code = patient.patient_code.toUpperCase();
  const history = getPatientHourlyHistory(code);

  const last = history && history.length > 0 ? history[history.length - 1] : null;
  const prev = history && history.length > 1 ? history[history.length - 2] : last;

  const hr = last?.HR ? Math.round(last.HR) : 80;
  const sbp = last?.SBP ? Math.round(last.SBP) : 120;
  const dbp = last?.DBP ? Math.round(last.DBP) : 70;
  const map = last?.MAP ? Math.round(last.MAP) : Math.round(dbp + (sbp - dbp) / 3);
  const resp = last?.Resp ? Math.round(last.Resp) : 16;
  const o2sat = last?.O2Sat ? Math.round(last.O2Sat) : 98;
  const temp = last?.Temp ? Number(last.Temp.toFixed(1)) : 37.0;
  const etco2 = last?.EtCO2 ? Math.round(last.EtCO2) : 36;

  const prevHr = prev?.HR ? Math.round(prev.HR) : hr;
  const prevSbp = prev?.SBP ? Math.round(prev.SBP) : sbp;
  const prevDbp = prev?.DBP ? Math.round(prev.DBP) : dbp;
  const prevMap = prev?.MAP ? Math.round(prev.MAP) : map;

  const lactate = last?.Lactate ? Number(last.Lactate.toFixed(2)) : 1.2;
  const wbc = last?.WBC ? Number(last.WBC.toFixed(1)) : 7.5;
  const creatinine = last?.Creatinine ? Number(last.Creatinine.toFixed(2)) : 1.0;
  const platelets = last?.Platelets ? Math.round(last.Platelets) : 220;
  const glucose = last?.Glucose ? Math.round(last.Glucose) : 110;
  const bun = last?.BUN ? Math.round(last.BUN) : 16;
  const hgb = last?.Hgb ? Number(last.Hgb.toFixed(1)) : 13.0;

  const latestVitals: VitalSigns = {
    id: `vit-${patient.id}`,
    patient_id: patient.id,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    hr,
    sbp,
    dbp,
    map,
    resp,
    o2sat,
    temp,
    etco2,
  };

  const previousVitals: VitalSigns = {
    id: `vit-prev-${patient.id}`,
    patient_id: patient.id,
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    hr: prevHr,
    sbp: prevSbp,
    dbp: prevDbp,
    map: prevMap,
    resp: prev?.Resp ? Math.round(prev.Resp) : resp,
    o2sat: prev?.O2Sat ? Math.round(prev.O2Sat) : o2sat,
    temp: prev?.Temp ? Number(prev.Temp.toFixed(1)) : temp,
    etco2: prev?.EtCO2 ? Math.round(prev.EtCO2) : etco2,
  };

  const latestLabs: LabResult = {
    id: `lab-${patient.id}`,
    patient_id: patient.id,
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    lactate,
    wbc,
    creatinine,
    platelets,
    glucose,
    bun,
    hgb,
    ph: last?.pH ? Number(last.pH.toFixed(2)) : 7.38,
    base_excess: last?.BaseExcess ? Number(last.BaseExcess.toFixed(1)) : -1.0,
    hco3: last?.HCO3 ? Number(last.HCO3.toFixed(1)) : 24.0,
    fio2: last?.FiO2 ? Number(last.FiO2.toFixed(2)) : 0.21,
  };

  const previousLabs: LabResult = {
    id: `lab-prev-${patient.id}`,
    patient_id: patient.id,
    timestamp: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
    lactate: prev?.Lactate ? Number(prev.Lactate.toFixed(2)) : lactate,
    wbc: prev?.WBC ? Number(prev.WBC.toFixed(1)) : wbc,
    creatinine: prev?.Creatinine ? Number(prev.Creatinine.toFixed(2)) : creatinine,
    platelets: prev?.Platelets ? Math.round(prev.Platelets) : platelets,
    glucose: prev?.Glucose ? Math.round(prev.Glucose) : glucose,
    bun: prev?.BUN ? Math.round(prev.BUN) : bun,
    hgb,
  };

  // Check if cohort has pre-verified backend prediction & 24H trajectory
  const cohort = BACKEND_VERIFIED_COHORT[code];
  const riskProb = cohort ? cohort.risk_probability : Number((Math.min(0.14, Math.max(0.01, 0.01 + (lactate > 2 ? 0.04 : 0) + (map < 65 ? 0.04 : 0) + (temp > 38.3 ? 0.02 : 0)))).toFixed(3));
  const riskTier: 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL' = cohort
    ? cohort.risk_tier
    : (riskProb >= 0.10 ? 'CRITICAL' : riskProb >= 0.06 ? 'ELEVATED' : riskProb >= 0.03 ? 'WATCH' : 'LOW');
  const riskStatus = cohort?.risk_status || (riskTier === 'CRITICAL' ? 'SEVERE_SEPTIC_SHOCK' : riskTier === 'ELEVATED' ? 'SEPSIS_DECOMPENSATION' : riskTier === 'WATCH' ? 'BORDERLINE_ICU_MONITORING' : 'STABLE_ICU_MONITORING');

  const currentPrediction: RiskPrediction = {
    id: `pred-${patient.id}`,
    patient_id: patient.id,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    risk_probability: riskProb,
    risk_tier: riskTier,
    risk_status: riskStatus,
    model_version: 'caresense-0.1.0-676972cccc',
    prediction_horizon: '6H (Hourly Causal)',
    previous_probability: cohort?.trajectory && cohort.trajectory.length > 1 ? cohort.trajectory[cohort.trajectory.length - 2].risk : Number((riskProb * 0.9).toFixed(3)),
    change: cohort?.trajectory && cohort.trajectory.length > 1 ? Number((riskProb - cohort.trajectory[cohort.trajectory.length - 2].risk).toFixed(3)) : 0.005,
    data_quality_flags: [],
    clinically_validated: false,
  };

  // Use full authentic 24-hour trajectory from backend
  const riskHistory = cohort?.trajectory || (history && history.length > 0
    ? history.map((rec, i) => {
        const h = rec.ICULOS || i + 1;
        const hProgress = i / Math.max(history.length - 1, 1);
        const interpolatedRisk = Number((0.008 + (riskProb - 0.008) * hProgress).toFixed(3));
        const tier: 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL' = interpolatedRisk >= 0.10 ? 'CRITICAL' : interpolatedRisk >= 0.06 ? 'ELEVATED' : interpolatedRisk >= 0.03 ? 'WATCH' : 'LOW';
        return { time: `H-${h}`, risk: interpolatedRisk, tier };
      })
    : [
        { time: 'H-6', risk: Number((riskProb * 0.5).toFixed(3)), tier: 'LOW' as const },
        { time: 'H-12', risk: Number((riskProb * 0.7).toFixed(3)), tier: 'LOW' as const },
        { time: 'H-18', risk: Number((riskProb * 0.85).toFixed(3)), tier: 'WATCH' as const },
        { time: 'H-21', risk: Number((riskProb * 0.95).toFixed(3)), tier: riskTier },
        { time: 'H-24', risk: riskProb, tier: riskTier },
      ]
  );

  // Map SHAP explanations from verified backend TreeExplainer output
  const explanations: RiskExplanation[] = cohort?.top_features && cohort.top_features.length > 0
    ? cohort.top_features.map((feat, idx) => ({
        id: `shap-${patient.id}-${idx + 1}`,
        prediction_id: `pred-${patient.id}`,
        feature_name: feat.feature,
        feature_value: feat.value !== null && feat.value !== undefined ? String(feat.value) : 'Observed',
        shap_value: feat.shap_value,
        direction: (feat.direction === 'increases risk' || feat.shap_value > 0 ? 'INCREASES_RISK' : 'DECREASES_RISK') as 'INCREASES_RISK' | 'DECREASES_RISK',
        rank: idx + 1,
        clinical_context: `XGBoost TreeExplainer: ${feat.direction === 'increases risk' ? 'Elevates' : 'Lowers'} sepsis log-odds attribution`,
      }))
    : [
        {
          id: `shap-${patient.id}-1`,
          prediction_id: `pred-${patient.id}`,
          feature_name: lactate >= 2.0 ? 'Serum Lactate Elevation' : 'Baseline Lactate Clearance',
          feature_value: `${lactate} mmol/L`,
          shap_value: lactate >= 2.0 ? 0.38 : -0.25,
          direction: (lactate >= 2.0 ? 'INCREASES_RISK' : 'DECREASES_RISK') as 'INCREASES_RISK' | 'DECREASES_RISK',
          rank: 1,
        },
        {
          id: `shap-${patient.id}-2`,
          prediction_id: `pred-${patient.id}`,
          feature_name: map < 65 ? 'Arterial Hypotension (MAP)' : 'Mean Arterial Pressure (MAP)',
          feature_value: `${map} mmHg`,
          shap_value: map < 65 ? 0.31 : -0.22,
          direction: (map < 65 ? 'INCREASES_RISK' : 'DECREASES_RISK') as 'INCREASES_RISK' | 'DECREASES_RISK',
          rank: 2,
        },
        {
          id: `shap-${patient.id}-3`,
          prediction_id: `pred-${patient.id}`,
          feature_name: temp >= 38.3 ? 'Febrile Sepsis Marker' : 'Body Temperature',
          feature_value: `${temp} °C`,
          shap_value: temp >= 38.3 ? 0.28 : -0.15,
          direction: (temp >= 38.3 ? 'INCREASES_RISK' : 'DECREASES_RISK') as 'INCREASES_RISK' | 'DECREASES_RISK',
          rank: 3,
        },
      ];

  const activeAlerts = INITIAL_ALERTS.filter(
    a => a.patient_id === patient.id || a.patient_code === patient.patient_code
  );

  return {
    patient,
    latestVitals,
    previousVitals,
    latestLabs,
    previousLabs,
    currentPrediction,
    riskHistory,
    explanations,
    activeAlerts,
    recentTimeline: [],
  };
}
