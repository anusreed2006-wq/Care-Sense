/**
 * CareSense Clinical Decision-Support Platform
 * Core TypeScript Definitions & Database Entities
 */

export type UserRole = 'admin' | 'clinician' | 'researcher';

export interface UserProfile {
  id: string;
  user_id?: string;
  full_name: string;
  role: UserRole;
  hospital_id: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export type PatientStatus = 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED';

export interface Patient {
  id: string;
  patient_code: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  icu_bed: string;
  admission_time: string;
  status: PatientStatus;
  created_at: string;
  updated_at?: string;
}

export interface VitalSigns {
  id: string;
  patient_id: string;
  timestamp: string;
  hr: number;      // Heart rate (bpm)
  o2sat: number;   // Oxygen saturation (%)
  temp: number;    // Temperature (°C)
  sbp: number;     // Systolic BP (mmHg)
  map: number;     // Mean Arterial Pressure (mmHg)
  dbp: number;     // Diastolic BP (mmHg)
  resp: number;    // Respiration rate (breaths/min)
  etco2?: number;  // End-tidal CO2 (mmHg)
  created_at?: string;
}

export interface LabResult {
  id: string;
  patient_id: string;
  timestamp: string;
  lactate: number;        // mmol/L (Normal < 2.0, Critical > 4.0)
  wbc: number;            // 10^3/uL (Normal 4.5 - 11.0)
  creatinine: number;     // mg/dL (Normal 0.7 - 1.3)
  platelets: number;      // 10^3/uL (Normal 150 - 450)
  glucose: number;        // mg/dL
  hgb: number;            // g/dL
  bun: number;            // mg/dL
  base_excess?: number;   // mEq/L
  hco3?: number;          // mEq/L
  fio2?: number;          // Fraction
  ph?: number;            // Arterial pH
  paco2?: number;         // mmHg
  sao2?: number;          // %
  ast?: number;           // U/L
  alkalinephos?: number;  // U/L
  calcium?: number;       // mg/dL
  chloride?: number;      // mEq/L
  bilirubin_direct?: number;
  bilirubin_total?: number;
  magnesium?: number;
  phosphate?: number;
  potassium?: number;
  troponini?: number;
  hct?: number;
  ptt?: number;
  fibrinogen?: number;
  created_at?: string;
}

export type RiskTier = 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL';

export interface RiskPrediction {
  id: string;
  patient_id: string;
  timestamp: string;
  risk_probability: number; // 0.000 to 1.000
  risk_tier: RiskTier;
  risk_status: string;
  model_version: string;
  prediction_horizon: string; // e.g. "6H"
  previous_probability?: number;
  change?: number;
  created_at?: string;
}

export type ShapDirection = 'INCREASES_RISK' | 'DECREASES_RISK' | 'NEUTRAL';

export interface RiskExplanation {
  id: string;
  prediction_id: string;
  feature_name: string;
  feature_value: string;
  shap_value: number;
  direction: ShapDirection;
  rank: number;
  clinical_context?: string;
}

export type AlertSeverity = 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: string;
  patient_id: string;
  patient_code?: string;
  icu_bed?: string;
  prediction_id?: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  timestamp: string;
  event_type: 'ADMISSION' | 'VITAL_CHANGE' | 'RISK_INCREASE' | 'ALERT' | 'CLINICAL_REVIEW' | 'PREDICTION_UPDATE' | 'MEDICATION';
  title: string;
  description?: string;
  severity: AlertSeverity;
}

export interface ModelVersion {
  id: string;
  model_name: string;
  version: string;
  status: 'Ready' | 'Training' | 'Deprecated';
  created_at: string;
  metrics: {
    auroc: number;
    auprc: number;
    sensitivity: number;
    specificity: number;
    avg_latency_ms: number;
    predictions_count?: number;
    last_prediction_time?: string;
  };
  metadata: {
    framework: string;
    horizon_hours: number;
    features_count: number;
    calibration: string;
    model_type?: string;
  };
}

export interface SimulationPatient {
  id: string;
  patient_id: string;
  is_default: boolean;
  trajectory_type: 'SEPTIC_SHOCK' | 'RAPID_DECOMPENSATION' | 'BORDERLINE_WATCH' | 'STABLE_RECOVERY' | 'ELDERLY_RISK' | 'CUSTOM';
  scenario_description: string;
  patient_code: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  icu_bed: string;
}

export interface EnrichedPatientData {
  patient: Patient;
  latestVitals: VitalSigns;
  previousVitals?: VitalSigns;
  latestLabs: LabResult;
  previousLabs?: LabResult;
  currentPrediction: RiskPrediction;
  riskHistory: { time: string; risk: number; tier: RiskTier }[];
  explanations: RiskExplanation[];
  activeAlerts: Alert[];
  recentTimeline: TimelineEvent[];
}

export type AppMode = 'demo' | 'live';
export type NavigationTab = 
  | 'dashboard'
  | 'patients'
  | 'risk-monitoring'
  | 'alerts'
  | 'analytics'
  | 'model-insights'
  | 'simulation'
  | 'reports'
  | 'settings'
  | 'admin';

export interface AppFeatureToggles {
  // Main view sections
  showRiskScoreCard: boolean;
  showRiskTrajectory: boolean;
  showExplainableAI: boolean;
  showVitalsTelemetry: boolean;
  showLabBiomarkers: boolean;
  showSepsisBundle: boolean;
  showEventTimeline: boolean;
  showCriticalAlertBanner: boolean;
  showWardOverviewCharts: boolean;
  
  // Specific vital indicators
  showEtCO2: boolean;
  showShockIndex: boolean;
  showBaseExcess: boolean;

  // Navigation module availability
  enableSimulationLab: boolean;
  enableAnalyticsTab: boolean;
  enableReportsTab: boolean;
  enableMicroWindows: boolean;

  // Hidden patient IDs
  hiddenPatientIds: string[];
}

export interface MetricHistoryItem {
  timestamp: string;
  timeLabel: string;
  value: number;
  secondaryValue?: number;
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface MetricHistoryModalData {
  metricKey: string;
  title: string;
  unit: string;
  currentValue: number | string;
  normalRange: string;
  criticalThreshold?: string;
  description: string;
  history: MetricHistoryItem[];
  color: string;
  referenceLineLow?: number;
  referenceLineHigh?: number;
}
