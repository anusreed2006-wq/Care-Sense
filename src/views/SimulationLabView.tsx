import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCareSense } from '../hooks/useCareSense';
import { RiskBadge } from '../components/common/RiskBadge';
import { caresenseApi, mapBackendTierToRiskTier } from '../services/caresenseApi';
import { SimulationBackendTestResult, RiskTier, VitalSigns, LabResult } from '../types';
import {
  Sliders,
  RotateCcw,
  Heart,
  Droplet,
  Wind,
  Thermometer,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Server,
  RefreshCw,
  Database,
  Cpu,
  Activity,
  Layers,
  Search,
  Filter,
  User,
  Clock,
  Bed,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { augmentedInferenceService } from '../services/augmentedInferenceService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { getPatientHourlyHistory } from '../data/patientHistoryDataset';

export interface CompleteSimulationLabsState {
  // A. Blood Gas / Respiratory
  base_excess: number;
  hco3: number;
  fio2: number;
  ph: number;
  paco2: number;
  sao2: number;

  // B. Renal / Metabolic
  bun: number;
  calcium: number;
  chloride: number;
  creatinine: number;
  glucose: number;
  lactate: number;
  magnesium: number;
  phosphate: number;
  potassium: number;

  // C. Liver
  ast: number;
  alkalinephos: number;
  bilirubin_direct: number;
  bilirubin_total: number;

  // D. Cardiac
  troponini: number;

  // E. Hematology / Coagulation
  hct: number;
  hgb: number;
  ptt: number;
  wbc: number;
  fibrinogen: number;
  platelets: number;
}

export interface CompleteSimulationVitalsState {
  hr: number;
  o2sat: number;
  temp: number;
  sbp: number;
  map: number;
  dbp: number;
  resp: number;
  etco2: number;
}

export interface SimulationIcuContextState {
  age: number;
  gender: 'M' | 'F';
  unit1: number;
  unit2: number;
  hospAdmTime: number;
  iculos: number;
}

interface LabFieldDefinition {
  key: keyof CompleteSimulationLabsState;
  label: string;
  abbreviation: string;
  group: 'A' | 'B' | 'C' | 'D' | 'E';
  unit: string;
  min: number;
  max: number;
  step: number;
  refMin: number;
  refMax: number;
  refDisplay: string;
  description: string;
}

const LAB_FIELD_DEFINITIONS: LabFieldDefinition[] = [
  // Group A: Blood Gas / Respiratory
  {
    key: 'base_excess',
    label: 'Base Excess',
    abbreviation: 'BaseExcess',
    group: 'A',
    unit: 'mEq/L',
    min: -25,
    max: 25,
    step: 0.1,
    refMin: -2.0,
    refMax: 2.0,
    refDisplay: '-2.0 to +2.0 mEq/L',
    description: 'Surplus or deficit of base in systemic circulation; negative indicates metabolic acidosis.',
  },
  {
    key: 'hco3',
    label: 'Bicarbonate (HCO3)',
    abbreviation: 'HCO3',
    group: 'A',
    unit: 'mEq/L',
    min: 5,
    max: 50,
    step: 0.5,
    refMin: 22.0,
    refMax: 28.0,
    refDisplay: '22.0 - 28.0 mEq/L',
    description: 'Renal acid-base buffering capacity.',
  },
  {
    key: 'fio2',
    label: 'Fraction of Inspired O2 (FiO2)',
    abbreviation: 'FiO2',
    group: 'A',
    unit: 'fraction',
    min: 0.21,
    max: 1.00,
    step: 0.01,
    refMin: 0.21,
    refMax: 0.40,
    refDisplay: '0.21 (Room Air) - 0.40',
    description: 'Supplemental oxygen fraction; 0.21 is ambient room air.',
  },
  {
    key: 'ph',
    label: 'Arterial Blood pH',
    abbreviation: 'pH',
    group: 'A',
    unit: 'pH',
    min: 6.80,
    max: 7.80,
    step: 0.01,
    refMin: 7.35,
    refMax: 7.45,
    refDisplay: '7.35 - 7.45',
    description: 'Systemic arterial acid-base equilibrium.',
  },
  {
    key: 'paco2',
    label: 'Partial Pressure of CO2 (PaCO2)',
    abbreviation: 'PaCO2',
    group: 'A',
    unit: 'mmHg',
    min: 15,
    max: 100,
    step: 1,
    refMin: 35,
    refMax: 45,
    refDisplay: '35 - 45 mmHg',
    description: 'Respiratory component of acid-base balance.',
  },
  {
    key: 'sao2',
    label: 'Arterial Oxygen Saturation (SaO2)',
    abbreviation: 'SaO2',
    group: 'A',
    unit: '%',
    min: 60,
    max: 100,
    step: 1,
    refMin: 95,
    refMax: 100,
    refDisplay: '95 - 100 %',
    description: 'Fraction of oxygen-saturated arterial hemoglobin.',
  },

  // Group B: Renal / Metabolic
  {
    key: 'bun',
    label: 'Blood Urea Nitrogen (BUN)',
    abbreviation: 'BUN',
    group: 'B',
    unit: 'mg/dL',
    min: 3,
    max: 120,
    step: 1,
    refMin: 7,
    refMax: 20,
    refDisplay: '7 - 20 mg/dL',
    description: 'Renal nitrogenous waste clearance.',
  },
  {
    key: 'calcium',
    label: 'Serum Calcium',
    abbreviation: 'Calcium',
    group: 'B',
    unit: 'mg/dL',
    min: 4.0,
    max: 16.0,
    step: 0.1,
    refMin: 8.5,
    refMax: 10.5,
    refDisplay: '8.5 - 10.5 mg/dL',
    description: 'Neuromuscular and vascular tone electrolyte.',
  },
  {
    key: 'chloride',
    label: 'Serum Chloride',
    abbreviation: 'Chloride',
    group: 'B',
    unit: 'mEq/L',
    min: 70,
    max: 140,
    step: 1,
    refMin: 96,
    refMax: 106,
    refDisplay: '96 - 106 mEq/L',
    description: 'Extracellular fluid volume & acid-base regulation.',
  },
  {
    key: 'creatinine',
    label: 'Serum Creatinine',
    abbreviation: 'Creatinine',
    group: 'B',
    unit: 'mg/dL',
    min: 0.3,
    max: 8.0,
    step: 0.1,
    refMin: 0.6,
    refMax: 1.3,
    refDisplay: '0.6 - 1.3 mg/dL',
    description: 'Glomerular filtration marker; doubles in acute kidney injury.',
  },
  {
    key: 'glucose',
    label: 'Serum Glucose',
    abbreviation: 'Glucose',
    group: 'B',
    unit: 'mg/dL',
    min: 40,
    max: 450,
    step: 1,
    refMin: 70,
    refMax: 140,
    refDisplay: '70 - 140 mg/dL',
    description: 'Blood sugar level; stress hyperglycemia is common in sepsis.',
  },
  {
    key: 'lactate',
    label: 'Serum Lactate',
    abbreviation: 'Lactate',
    group: 'B',
    unit: 'mmol/L',
    min: 0.4,
    max: 12.0,
    step: 0.1,
    refMin: 0.5,
    refMax: 2.0,
    refDisplay: '< 2.0 mmol/L (Critical ≥ 4.0)',
    description: 'Key Sepsis-3 tissue hypoperfusion and anaerobic metabolism biomarker.',
  },
  {
    key: 'magnesium',
    label: 'Serum Magnesium',
    abbreviation: 'Magnesium',
    group: 'B',
    unit: 'mg/dL',
    min: 0.8,
    max: 5.0,
    step: 0.1,
    refMin: 1.7,
    refMax: 2.2,
    refDisplay: '1.7 - 2.2 mg/dL',
    description: 'Intracellular enzymatic and cardiac stabilizing cation.',
  },
  {
    key: 'phosphate',
    label: 'Serum Phosphate',
    abbreviation: 'Phosphate',
    group: 'B',
    unit: 'mg/dL',
    min: 1.0,
    max: 9.0,
    step: 0.1,
    refMin: 2.5,
    refMax: 4.5,
    refDisplay: '2.5 - 4.5 mg/dL',
    description: 'Cellular energy and membrane integrity mineral.',
  },
  {
    key: 'potassium',
    label: 'Serum Potassium',
    abbreviation: 'Potassium',
    group: 'B',
    unit: 'mEq/L',
    min: 2.0,
    max: 8.5,
    step: 0.1,
    refMin: 3.5,
    refMax: 5.0,
    refDisplay: '3.5 - 5.0 mEq/L',
    description: 'Critical myocardial membrane potential electrolyte.',
  },

  // Group C: Liver
  {
    key: 'ast',
    label: 'Aspartate Aminotransferase (AST)',
    abbreviation: 'AST',
    group: 'C',
    unit: 'U/L',
    min: 5,
    max: 500,
    step: 1,
    refMin: 10,
    refMax: 40,
    refDisplay: '10 - 40 U/L',
    description: 'Hepatic injury and hepatocellular ischemic necrosis marker.',
  },
  {
    key: 'alkalinephos',
    label: 'Alkaline Phosphatase (ALP)',
    abbreviation: 'Alkalinephos',
    group: 'C',
    unit: 'U/L',
    min: 20,
    max: 600,
    step: 1,
    refMin: 44,
    refMax: 147,
    refDisplay: '44 - 147 U/L',
    description: 'Hepatobiliary obstruction and cellular turnover enzyme.',
  },
  {
    key: 'bilirubin_direct',
    label: 'Direct (Conjugated) Bilirubin',
    abbreviation: 'Bilirubin_direct',
    group: 'C',
    unit: 'mg/dL',
    min: 0.0,
    max: 12.0,
    step: 0.1,
    refMin: 0.0,
    refMax: 0.3,
    refDisplay: '0.0 - 0.3 mg/dL',
    description: 'Hepatic biliary excretion status.',
  },
  {
    key: 'bilirubin_total',
    label: 'Total Serum Bilirubin',
    abbreviation: 'Bilirubin_total',
    group: 'C',
    unit: 'mg/dL',
    min: 0.1,
    max: 25.0,
    step: 0.1,
    refMin: 0.2,
    refMax: 1.2,
    refDisplay: '0.2 - 1.2 mg/dL',
    description: 'SOFA liver score criterion; elevated in hepatic dysfunction.',
  },

  // Group D: Cardiac
  {
    key: 'troponini',
    label: 'Cardiac Troponin I',
    abbreviation: 'TroponinI',
    group: 'D',
    unit: 'ng/mL',
    min: 0.00,
    max: 5.00,
    step: 0.01,
    refMin: 0.00,
    refMax: 0.04,
    refDisplay: '< 0.04 ng/mL',
    description: 'Myocardial injury biomarker; septic cardiomyopathy elevates troponin.',
  },

  // Group E: Hematology / Coagulation
  {
    key: 'hct',
    label: 'Hematocrit (Hct)',
    abbreviation: 'Hct',
    group: 'E',
    unit: '%',
    min: 15.0,
    max: 60.0,
    step: 0.5,
    refMin: 36.0,
    refMax: 50.0,
    refDisplay: '36.0 - 50.0 %',
    description: 'Red blood cell percentage of total blood volume.',
  },
  {
    key: 'hgb',
    label: 'Hemoglobin (Hgb)',
    abbreviation: 'Hgb',
    group: 'E',
    unit: 'g/dL',
    min: 4.0,
    max: 22.0,
    step: 0.1,
    refMin: 12.0,
    refMax: 17.5,
    refDisplay: '12.0 - 17.5 g/dL',
    description: 'Oxygen carrying capacity of circulating blood.',
  },
  {
    key: 'ptt',
    label: 'Partial Thromboplastin Time (PTT)',
    abbreviation: 'PTT',
    group: 'E',
    unit: 'sec',
    min: 15,
    max: 140,
    step: 1,
    refMin: 25,
    refMax: 35,
    refDisplay: '25 - 35 sec',
    description: 'Intrinsic coagulation cascade; prolonged in sepsis-induced coagulopathy.',
  },
  {
    key: 'wbc',
    label: 'White Blood Cell Count (WBC)',
    abbreviation: 'WBC',
    group: 'E',
    unit: 'k/µL',
    min: 1.0,
    max: 40.0,
    step: 0.1,
    refMin: 4.0,
    refMax: 11.0,
    refDisplay: '4.0 - 11.0 k/µL',
    description: 'SIRS criteria leukocytosis (>12) or ominous leukopenia (<4).',
  },
  {
    key: 'fibrinogen',
    label: 'Serum Fibrinogen',
    abbreviation: 'Fibrinogen',
    group: 'E',
    unit: 'mg/dL',
    min: 50,
    max: 800,
    step: 5,
    refMin: 200,
    refMax: 400,
    refDisplay: '200 - 400 mg/dL',
    description: 'Acute phase reactant consumed in disseminated intravascular coagulation (DIC).',
  },
  {
    key: 'platelets',
    label: 'Platelet Count',
    abbreviation: 'Platelets',
    group: 'E',
    unit: 'k/µL',
    min: 10,
    max: 600,
    step: 5,
    refMin: 150,
    refMax: 450,
    refDisplay: '150 - 450 k/µL',
    description: 'SOFA coagulation criterion; microvascular consumption drops platelets.',
  },
];

export const SimulationLabView: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    addToast,
    selectPatientAndNavigate,
    updatePatientClinicalData,
    backendApiUrl,
    featureToggles,
  } = useCareSense();

  // Find currently selected simulation patient
  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Whether to feed the full 24H prior trajectory to the backend for high model accuracy
  const [useLongitudinalHistory, setUseLongitudinalHistory] = useState<boolean>(true);

  // Whether the patient cohort selector form is expanded or displayed as a compact button
  const [isCohortSelectorOpen, setIsCohortSelectorOpen] = useState<boolean>(false);

  // Active laboratory category tab
  const [activeLabGroup, setActiveLabGroup] = useState<'ALL' | 'A' | 'B' | 'C' | 'D' | 'E'>('ALL');
  const [labSearchQuery, setLabSearchQuery] = useState<string>('');

  // ALL 8 VITAL INPUTS
  const [vitals, setVitals] = useState<CompleteSimulationVitalsState>({
    hr: 118,
    o2sat: 91,
    temp: 38.9,
    sbp: 87,
    map: 57,
    dbp: 43,
    resp: 30,
    etco2: 26,
  });

  // ALL 26 LABORATORY INPUTS
  const [labs, setLabs] = useState<CompleteSimulationLabsState>({
    // A. Blood Gas / Respiratory
    base_excess: -4.5,
    hco3: 18.0,
    fio2: 0.40,
    ph: 7.28,
    paco2: 32,
    sao2: 91,

    // B. Renal / Metabolic
    bun: 24,
    calcium: 8.2,
    chloride: 105,
    creatinine: 2.0,
    glucose: 178,
    lactate: 5.9,
    magnesium: 1.8,
    phosphate: 3.6,
    potassium: 4.6,

    // C. Liver
    ast: 45,
    alkalinephos: 92,
    bilirubin_direct: 0.6,
    bilirubin_total: 1.8,

    // D. Cardiac
    troponini: 0.08,

    // E. Hematology / Coagulation
    hct: 32.0,
    hgb: 10.4,
    ptt: 42,
    wbc: 19.6,
    fibrinogen: 340,
    platelets: 140,
  });

  // ALL 6 PATIENT / ICU CONTEXT FIELDS
  const [icuContext, setIcuContext] = useState<SimulationIcuContextState>({
    age: currentPatient.age || 65,
    gender: currentPatient.gender === 'F' ? 'F' : 'M',
    unit1: 1,
    unit2: 0,
    hospAdmTime: -8.0,
    iculos: 24,
  });

  // Backend model execution state
  const [isTestingBackend, setIsTestingBackend] = useState<boolean>(false);
  const [backendResult, setBackendResult] = useState<SimulationBackendTestResult | null>(null);

  // Synchronize MAP with SBP and DBP when desired
  const autoMapCalculated = Math.round(vitals.dbp + (vitals.sbp - vitals.dbp) / 3);
  const shockIndex = Number((vitals.hr / Math.max(vitals.sbp, 40)).toFixed(2));
  let sirsCount = 0;
  if (vitals.temp > 38.3 || vitals.temp < 36.0) sirsCount++;
  if (vitals.hr > 90) sirsCount++;
  if (vitals.resp > 20) sirsCount++;
  if (labs.wbc > 12.0 || labs.wbc < 4.0) sirsCount++;

  const sofaCv = vitals.map < 55 ? 3 : vitals.map < 65 ? 2 : vitals.map < 70 ? 1 : 0;

  /**
   * Unified CareSense Backend XGBoost Model Inference
   * Transmits all 26 labs, 8 vitals, and 6 ICU fields
   */
  const runBackendInference = useCallback(
    async (showToast = false) => {
      setIsTestingBackend(true);
      const activeUrl = backendApiUrl || caresenseApi.getApiUrl();

      try {
        const result = await caresenseApi.testSimulationPrediction(
          {
            hr: vitals.hr,
            o2sat: vitals.o2sat,
            temp: vitals.temp,
            sbp: vitals.sbp,
            map: vitals.map,
            dbp: vitals.dbp,
            resp: vitals.resp,
            etco2: vitals.etco2,
          },
          {
            base_excess: labs.base_excess,
            hco3: labs.hco3,
            fio2: labs.fio2,
            ph: labs.ph,
            paco2: labs.paco2,
            sao2: labs.sao2,
            bun: labs.bun,
            calcium: labs.calcium,
            chloride: labs.chloride,
            creatinine: labs.creatinine,
            glucose: labs.glucose,
            lactate: labs.lactate,
            magnesium: labs.magnesium,
            phosphate: labs.phosphate,
            potassium: labs.potassium,
            ast: labs.ast,
            alkalinephos: labs.alkalinephos,
            bilirubin_direct: labs.bilirubin_direct,
            bilirubin_total: labs.bilirubin_total,
            troponini: labs.troponini,
            hct: labs.hct,
            hgb: labs.hgb,
            ptt: labs.ptt,
            wbc: labs.wbc,
            fibrinogen: labs.fibrinogen,
            platelets: labs.platelets,
          },
          {
            age: icuContext.age,
            gender: icuContext.gender,
            patientCode: currentPatient.patient_code,
            useLongitudinalHistory,
            unit1: icuContext.unit1,
            unit2: icuContext.unit2,
            hospAdmTime: icuContext.hospAdmTime,
            iculos: icuContext.iculos,
          }
        );

        // If CareSense Dual-Engine Ensemble is enabled in Admin Panel, evaluate cognitive pipeline and blend
        if (augmentedInferenceService.isEnsembleActive() && result.success) {
          try {
            const augRes = await augmentedInferenceService.evaluateAugmentedSepsisRisk({
              vitals: {
                hr: vitals.hr,
                o2sat: vitals.o2sat,
                temp: vitals.temp,
                sbp: vitals.sbp,
                map: vitals.map,
                dbp: vitals.dbp,
                resp: vitals.resp,
                etco2: vitals.etco2,
              },
              labs,
              patientContext: {
                age: icuContext.age,
                gender: icuContext.gender,
                patientCode: currentPatient.patient_code,
                unit1: icuContext.unit1,
                unit2: icuContext.unit2,
                hospAdmTime: icuContext.hospAdmTime,
                iculos: icuContext.iculos,
              },
              rawBackendProbability: result.risk_probability,
            });

            if (augRes.isEnsembleActive) {
              result.risk_probability = augRes.blendedProbability;
              result.risk_tier = augRes.riskTier;
              result.risk_status = augRes.riskStatus;
              result.ensemble_metadata = {
                is_ensemble: true,
                api_weight: augRes.apiWeight,
                backend_weight: augRes.backendWeight,
                raw_api_probability: augRes.rawApiProbability,
                raw_backend_probability: augRes.rawBackendProbability,
                clinical_assessment: augRes.clinicalAssessment,
              };

              if (result.trajectory && result.trajectory.length > 0) {
                const lastIdx = result.trajectory.length - 1;
                result.trajectory[lastIdx].risk_probability = augRes.blendedProbability;
                result.trajectory[lastIdx].risk_tier = augRes.riskTier;
                result.trajectory[lastIdx].risk_status = augRes.riskStatus;
              }
            }
          } catch (augErr) {
            console.warn('[CareSense Simulation] Augmented ensemble fallback:', augErr);
          }
        }

        setBackendResult(result);

        if (showToast) {
          if (result.success) {
            if (result.ensemble_metadata?.is_ensemble) {
              addToast({
                type: 'success',
                title: 'Dual-Engine Consensus Prediction',
                description: `Blended Risk: ${(result.risk_probability * 100).toFixed(1)}% (${result.risk_tier}) via Ensemble (${result.ensemble_metadata.api_weight}% Cognitive / ${result.ensemble_metadata.backend_weight}% Base XGBoost)`,
              });
            } else {
              addToast({
                type: 'success',
                title: 'XGBoost Prediction Updated',
                description: `Risk: ${(result.risk_probability * 100).toFixed(1)}% (${result.risk_tier}) via ${result.model_version} in ${result.latencyMs}ms (26 labs & 8 vitals ingested)`,
              });
            }
          } else {
            addToast({
              type: 'critical',
              title: 'Backend Model Error',
              description: result.errorDescription || result.error || 'Prediction failed',
            });
          }
        }
      } catch (err: any) {
        setBackendResult({
          success: false,
          url: activeUrl,
          latencyMs: 0,
          risk_probability: 0.05,
          risk_tier: 'WATCH',
          risk_status: 'Connection Issue',
          model_version: 'caresense-0.1.0-676972cccc',
          top_features: [],
          data_quality_flags: ['Backend offline / connecting'],
          clinically_validated: false,
          testedAt: new Date().toISOString(),
          sentValues: { vitals, labs },
          error: err.message,
          errorDescription: `Connection failed: ${err.message}. Check backend URL in Settings.`,
        });
      } finally {
        setIsTestingBackend(false);
      }
    },
    [vitals, labs, icuContext, currentPatient, useLongitudinalHistory, backendApiUrl, addToast]
  );

  // Load a patient cohort preset with all 26 labs & 8 vitals
  const handleSelectPreset = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find(pt => pt.id === pId);
    if (!p) return;

    // Load authentic Hour 24 values from patient history dataset
    const history = getPatientHourlyHistory(p.patient_code);
    if (history && history.length > 0) {
      const last = history[history.length - 1];
      const autoMap = last.MAP ? Math.round(last.MAP) : (last.DBP && last.SBP ? Math.round(last.DBP + (last.SBP - last.DBP) / 3) : 85);

      setVitals({
        hr: Math.round(last.HR ?? 80),
        sbp: Math.round(last.SBP ?? 120),
        dbp: Math.round(last.DBP ?? 70),
        map: autoMap,
        resp: Math.round(last.Resp ?? 16),
        o2sat: Math.round(last.O2Sat ?? 98),
        temp: Number((last.Temp ?? 37.0).toFixed(1)),
        etco2: last.EtCO2 ? Math.round(last.EtCO2) : 38,
      });

      setLabs({
        // A. Blood Gas / Respiratory
        base_excess: last.BaseExcess ? Number(last.BaseExcess.toFixed(1)) : -0.5,
        hco3: last.HCO3 ? Number(last.HCO3.toFixed(1)) : 24.0,
        fio2: last.FiO2 ? Number(last.FiO2.toFixed(2)) : 0.21,
        ph: last.pH ? Number(last.pH.toFixed(2)) : 7.39,
        paco2: last.PaCO2 ? Math.round(last.PaCO2) : 38,
        sao2: last.SaO2 ? Math.round(last.SaO2) : (last.O2Sat ? Math.round(last.O2Sat) : 98),

        // B. Renal / Metabolic
        bun: last.BUN ? Math.round(last.BUN) : 16,
        calcium: last.Calcium ? Number(last.Calcium.toFixed(1)) : 8.8,
        chloride: last.Chloride ? Math.round(last.Chloride) : 102,
        creatinine: last.Creatinine ? Number(last.Creatinine.toFixed(2)) : 1.0,
        glucose: last.Glucose ? Math.round(last.Glucose) : 115,
        lactate: last.Lactate ? Number(last.Lactate.toFixed(2)) : 1.2,
        magnesium: last.Magnesium ? Number(last.Magnesium.toFixed(1)) : 2.0,
        phosphate: last.Phosphate ? Number(last.Phosphate.toFixed(1)) : 3.2,
        potassium: last.Potassium ? Number(last.Potassium.toFixed(1)) : 4.1,

        // C. Liver
        ast: last.AST ? Math.round(last.AST) : 28,
        alkalinephos: last.Alkalinephos ? Math.round(last.Alkalinephos) : 75,
        bilirubin_direct: last.Bilirubin_direct ? Number(last.Bilirubin_direct.toFixed(1)) : 0.2,
        bilirubin_total: last.Bilirubin_total ? Number(last.Bilirubin_total.toFixed(1)) : 0.8,

        // D. Cardiac
        troponini: last.TroponinI ? Number(last.TroponinI.toFixed(2)) : 0.02,

        // E. Hematology / Coagulation
        hct: last.Hct ? Number(last.Hct.toFixed(1)) : 38.0,
        hgb: last.Hgb ? Number(last.Hgb.toFixed(1)) : 13.0,
        ptt: last.PTT ? Math.round(last.PTT) : 30,
        wbc: last.WBC ? Number(last.WBC.toFixed(1)) : 7.5,
        fibrinogen: last.Fibrinogen ? Math.round(last.Fibrinogen) : 250,
        platelets: last.Platelets ? Math.round(last.Platelets) : 220,
      });

      setIcuContext({
        age: p.age ?? (last.Age ? Math.round(last.Age) : 65),
        gender: p.gender === 'F' ? 'F' : 'M',
        unit1: last.Unit1 !== undefined && last.Unit1 !== null ? Math.round(last.Unit1) : 1,
        unit2: last.Unit2 !== undefined && last.Unit2 !== null ? Math.round(last.Unit2) : 0,
        hospAdmTime: last.HospAdmTime !== undefined && last.HospAdmTime !== null ? Number(last.HospAdmTime.toFixed(1)) : -8.0,
        iculos: last.ICULOS !== undefined && last.ICULOS !== null ? Math.round(last.ICULOS) : 24,
      });
    }
  };

  // Re-loads verified Hour 24 baseline values into the sliders
  const handleLoadDatasetHour24 = () => {
    handleSelectPreset(currentPatient.id);
    addToast({
      type: 'info',
      title: 'Hour 24 Panel Loaded',
      description: `Loaded authentic Hour 24 vitals & 26 lab values for ${currentPatient.patient_code} from dataset.`,
    });
  };

  // Auto-run on first mount
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      runBackendInference(false);
    }
  }, [runBackendInference]);

  // Debounced auto-inference when sliders or context change
  useEffect(() => {
    const timer = setTimeout(() => {
      runBackendInference(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [vitals, labs, icuContext, useLongitudinalHistory, runBackendInference]);

  // Quick intervention actions
  const applyIntervention = (type: 'fluid' | 'antibiotics' | 'decompensate') => {
    if (type === 'fluid') {
      const newSbp = Math.min(160, vitals.sbp + 20);
      const newDbp = Math.min(90, vitals.dbp + 10);
      const newMap = Math.round(newDbp + (newSbp - newDbp) / 3);
      setVitals(prev => ({
        ...prev,
        sbp: newSbp,
        dbp: newDbp,
        map: newMap,
        hr: Math.max(65, prev.hr - 15),
      }));
      addToast({
        type: 'info',
        title: 'Intervention Simulated',
        description: '500 mL IV crystalloid bolus administered: MAP increased, tachycardia blunted.',
      });
    } else if (type === 'antibiotics') {
      setLabs(prev => ({
        ...prev,
        lactate: Number(Math.max(1.0, prev.lactate - 1.5).toFixed(1)),
        wbc: Number(Math.max(6.0, prev.wbc - 4.0).toFixed(1)),
      }));
      setVitals(prev => ({
        ...prev,
        temp: Number(Math.max(36.8, prev.temp - 0.8).toFixed(1)),
      }));
      addToast({
        type: 'success',
        title: 'Intervention Simulated',
        description: 'Empiric broad-spectrum antibiotic response: serum lactate cleared, fever subsided.',
      });
    } else if (type === 'decompensate') {
      const newSbp = Math.max(65, vitals.sbp - 25);
      const newDbp = Math.max(32, vitals.dbp - 15);
      const newMap = Math.round(newDbp + (newSbp - newDbp) / 3);
      setVitals(prev => ({
        ...prev,
        hr: Math.min(155, prev.hr + 25),
        sbp: newSbp,
        dbp: newDbp,
        map: newMap,
        resp: Math.min(38, prev.resp + 8),
        temp: 39.4,
      }));
      setLabs(prev => ({
        ...prev,
        lactate: Number((prev.lactate + 1.8).toFixed(1)),
        wbc: Number((prev.wbc + 5.0).toFixed(1)),
        creatinine: Number((prev.creatinine + 0.6).toFixed(1)),
        platelets: Math.max(40, prev.platelets - 45),
      }));
      addToast({
        type: 'critical',
        title: 'Decompensation Simulated',
        description: 'Acute septic decompensation: MAP collapsed, lactic acidemia exacerbated, thrombocytopenia worsened.',
      });
    }
  };

  // Sync MAP from SBP/DBP
  const handleAutoCalculateMap = () => {
    const computed = Math.round(vitals.dbp + (vitals.sbp - vitals.dbp) / 3);
    setVitals(prev => ({ ...prev, map: computed }));
    addToast({
      type: 'info',
      title: 'MAP Synced',
      description: `Mean Arterial Pressure updated to ${computed} mmHg based on SBP ${vitals.sbp} / DBP ${vitals.dbp}.`,
    });
  };

  /**
   * Applies all simulated vitals and labs to the active patient
   */
  const handleApplyToPatient = () => {
    updatePatientClinicalData(
      currentPatient.id,
      {
        hr: vitals.hr,
        sbp: vitals.sbp,
        dbp: vitals.dbp,
        resp: vitals.resp,
        o2sat: vitals.o2sat,
        temp: vitals.temp,
        map: vitals.map,
        etco2: vitals.etco2,
      },
      {
        lactate: labs.lactate,
        wbc: labs.wbc,
        creatinine: labs.creatinine,
        platelets: labs.platelets,
        glucose: labs.glucose,
        bun: labs.bun,
        hgb: labs.hgb,
        base_excess: labs.base_excess,
        hco3: labs.hco3,
        fio2: labs.fio2,
        ph: labs.ph,
        paco2: labs.paco2,
        sao2: labs.sao2,
        ast: labs.ast,
        alkalinephos: labs.alkalinephos,
        calcium: labs.calcium,
        chloride: labs.chloride,
        bilirubin_direct: labs.bilirubin_direct,
        bilirubin_total: labs.bilirubin_total,
        magnesium: labs.magnesium,
        phosphate: labs.phosphate,
        potassium: labs.potassium,
        troponini: labs.troponini,
        hct: labs.hct,
        ptt: labs.ptt,
        fibrinogen: labs.fibrinogen,
      }
    );

    addToast({
      type: 'success',
      title: 'Values Applied to Monitored Patient',
      description: `Patient ${currentPatient.patient_code} updated with all 26 labs & 8 vitals.`,
    });

    selectPatientAndNavigate(currentPatient.id, 'risk-monitoring');
  };

  // Helper to get normal / reference badge
  const getLabStatus = (def: LabFieldDefinition, val: number) => {
    const isCriticalHigh =
      (def.key === 'lactate' && val >= 4.0) ||
      (def.key === 'ph' && (val < 7.20 || val > 7.55)) ||
      (def.key === 'platelets' && val < 50) ||
      (def.key === 'potassium' && (val < 2.8 || val > 6.2)) ||
      (def.key === 'troponini' && val > 0.4);

    const isHigh = val > def.refMax;
    const isLow = val < def.refMin;

    if (isCriticalHigh) {
      return { label: 'Critical', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
    if (isHigh) {
      return { label: 'Elevated', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (isLow) {
      return { label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
    return { label: 'Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  // Filtered lab definitions based on active category and search
  const filteredLabDefs = useMemo(() => {
    return LAB_FIELD_DEFINITIONS.filter(def => {
      const matchesGroup = activeLabGroup === 'ALL' || def.group === activeLabGroup;
      const q = labSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        def.label.toLowerCase().includes(q) ||
        def.abbreviation.toLowerCase().includes(q) ||
        def.unit.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [activeLabGroup, labSearchQuery]);

  const activeBackendUrl = backendApiUrl || caresenseApi.getApiUrl();

  const mappedTier: RiskTier = backendResult
    ? mapBackendTierToRiskTier(backendResult.risk_tier)
    : (vitals.map < 65 || labs.lactate >= 4.0 ? 'CRITICAL' : labs.lactate >= 2.0 ? 'ELEVATED' : 'LOW');

  return (
    <div className="space-y-6">
      {/* Simulation Lab Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              CareSense Interactive ML Simulation Lab
            </h1>
            <span className="rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-mono px-2 py-0.5 font-bold">
              Full 26 Labs + 8 Vitals Active
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Complete high-fidelity physiological simulation. Adjust all 26 laboratory biomarkers, 8 vital signs, and ICU admission demographics to observe live XGBoost predictions, 24-hour continuous risk trajectories, and TreeExplainer SHAP attributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleSelectPreset(currentPatient.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <RotateCcw size={13} />
            <span>Reset Inputs</span>
          </button>

          <button
            onClick={() => runBackendInference(true)}
            disabled={isTestingBackend}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-extrabold px-4 py-2 text-xs shadow-md transition disabled:opacity-50"
            title={`Run inference on ${activeBackendUrl}`}
          >
            <Zap size={14} className={isTestingBackend ? 'animate-bounce text-slate-900' : 'text-slate-950 fill-current'} />
            <span>{isTestingBackend ? 'Running XGBoost...' : '⚡ Run XGBoost Prediction'}</span>
          </button>
        </div>
      </div>

      {/* Preset Simulation Patient Selector & Dataset Cohort (Target element div:nth-of-type(2)) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all duration-200">
        {!isCohortSelectorOpen ? (
          /* Button View Format: Collapsed state ("otherwise it want to be like button") */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shadow-2xs">
                <Database size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    PhysioNet Sepsis-3 24H Longitudinal Simulation Cohorts
                  </span>
                  <span className="rounded-md bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-bold">
                    9 Patient Cohorts
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="text-slate-600 font-medium">Active Cohort:</span>
                  <span className="font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-md px-2 py-0.5 text-xs">
                    {currentPatient.patient_code} ({currentPatient.gender}, {currentPatient.age}y - {currentPatient.icu_bed})
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-slate-500 text-[11px]">Click button to open cohort selection panel</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLoadDatasetHour24}
                className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 font-bold transition flex items-center gap-1 cursor-pointer"
                title="Load Hour 24 values into sliders"
              >
                <RotateCcw size={12} />
                <span>Reset H24</span>
              </button>

              <button
                type="button"
                id="btn-open-cohort-form"
                onClick={() => setIsCohortSelectorOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold px-4 py-2 text-xs shadow-xs hover:shadow-sm transition active:scale-95 cursor-pointer"
                title="Click to view in full patient cohort form"
              >
                <Database size={14} />
                <span>Select / Switch Cohort</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Full Form View Format ("when user click it want to view in this form") */
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Database size={14} className="text-sky-600" />
                  <span>PhysioNet Sepsis-3 24-Hour Longitudinal Simulation Cohorts</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a clinical trajectory to simulate. Each patient record feeds 24 hours of chronologically verified ICU telemetry to the XGBoost feature pipeline.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <span className="text-[11px] text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 font-semibold">
                  Active: {currentPatient.patient_code} ({currentPatient.gender}, {currentPatient.age}y - {currentPatient.icu_bed})
                </span>
                <button
                  type="button"
                  onClick={handleLoadDatasetHour24}
                  className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1 font-bold transition cursor-pointer"
                  title="Load Hour 24 values into sliders"
                >
                  Reset to H24 Baseline
                </button>
                <button
                  type="button"
                  id="btn-collapse-cohort-form"
                  onClick={() => setIsCohortSelectorOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                  title="Collapse back to button"
                >
                  <ChevronUp size={14} />
                  <span>Collapse Form</span>
                </button>
              </div>
            </div>

            {/* 2-Row Grid for Patients: Dataset Cohorts + ICU Benchmarks */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Authentic PhysioNet Sepsis-3 24H Dataset Patients:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {patients.filter(p => ['P-1001', 'P-1002', 'P-1003', 'P-1004', 'P-1005'].includes(p.patient_code)).map(p => {
                  const isSelected = p.id === currentPatient.id;
                  const descriptions: Record<string, { label: string; badge: string; color: string }> = {
                    'P-1001': { label: 'Stable Baseline', badge: '1.2% Risk', color: 'text-emerald-700 bg-emerald-50' },
                    'P-1002': { label: 'Sepsis Decompensation', badge: '8.5% Risk', color: 'text-rose-700 bg-rose-50' },
                    'P-1003': { label: 'Severe Septic Shock', badge: '10.5% Risk', color: 'text-rose-700 bg-rose-50' },
                    'P-1004': { label: 'Fulminant ARDS/Shock', badge: '12.5% Risk', color: 'text-rose-700 bg-rose-50' },
                    'P-1005': { label: 'Shock Resuscitation', badge: '1.1% Risk', color: 'text-teal-700 bg-teal-50' },
                  };
                  const meta = descriptions[p.patient_code] || { label: 'ICU Cohort', badge: '24H', color: 'text-slate-600 bg-slate-100' };

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/80 shadow-2xs ring-2 ring-sky-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-extrabold text-xs text-slate-900">{p.patient_code}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${meta.color}`}>
                          {meta.badge}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 mt-1 line-clamp-1">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.icu_bed} • {p.age}y {p.gender}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                ICU Benchmark & Unit Patients:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {patients.filter(p => ['P-1042', 'P-1024', 'P-1018', 'P-1033'].includes(p.patient_code)).map(p => {
                  const isSelected = p.id === currentPatient.id;
                  const descriptions: Record<string, { label: string; badge: string; color: string }> = {
                    'P-1042': { label: 'Severe Septic Shock (AKI-2)', badge: '11.5% Risk', color: 'text-rose-700 bg-rose-50' },
                    'P-1024': { label: 'Rapid Decompensation', badge: '8.7% Risk', color: 'text-orange-700 bg-orange-50' },
                    'P-1018': { label: 'Post-Op SIRS Laparotomy', badge: '5.1% Risk', color: 'text-amber-700 bg-amber-50' },
                    'P-1033': { label: 'Geriatric Sepsis / Renal', badge: '2.3% Risk', color: 'text-emerald-700 bg-emerald-50' },
                  };
                  const meta = descriptions[p.patient_code] || { label: 'Unit Patient', badge: 'ICU', color: 'text-slate-600 bg-slate-100' };

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/80 shadow-2xs ring-2 ring-sky-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-extrabold text-xs text-slate-900">{p.patient_code}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${meta.color}`}>
                          {meta.badge}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 mt-1 line-clamp-1">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.icu_bed} • {p.age}y {p.gender}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Longitudinal 24H Context Toggle & Fast Interventions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useLongitudinalHistory}
                  onChange={e => setUseLongitudinalHistory(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  Transmit 24-Hour Longitudinal ICU Trajectory to CareSense XGBoost (Recommended for Accurate Causal Rolling Features)
                </span>
              </label>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  {useLongitudinalHistory ? '23 prior trajectory hours + Hour 24 inputs' : 'Single snapshot only'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCohortSelectorOpen(false)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronUp size={13} />
                  <span>Done / Minimize to Button</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Clinical Intervention Presets */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <span className="text-xs font-bold text-slate-600 mr-2">Quick Interventions:</span>
        <button
          onClick={() => applyIntervention('fluid')}
          className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50 transition shadow-2xs flex items-center gap-1.5"
        >
          <Droplet size={13} className="text-sky-600" />
          <span>Simulate 500mL IV Crystalloids (MAP ↑)</span>
        </button>
        <button
          onClick={() => applyIntervention('antibiotics')}
          className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs flex items-center gap-1.5"
        >
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Simulate Antimicrobial Lactate Clearance</span>
        </button>
        <button
          onClick={() => applyIntervention('decompensate')}
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5"
        >
          <AlertTriangle size={13} className="text-rose-600" />
          <span>Simulate Acute Septic Shock Decompensation</span>
        </button>
      </div>

      {/* Main Simulation Workspace: Left Column (7 cols) controls, Right Column (5 cols) Live Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (7 cols): Vitals + ICU Demographics + Complete 26-Lab Panel */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: ALL 8 VITAL SIGNS INPUTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-rose-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Hemodynamic & Vital Signs Inputs (8 / 8)
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Real-time XGBoost updates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Heart Rate (HR) */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Heart Rate (HR)</span>
                  <span className="font-mono text-rose-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {vitals.hr} bpm
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: 60 - 100 bpm</span>
                  <span className={vitals.hr > 100 ? 'text-rose-600 font-bold' : vitals.hr < 60 ? 'text-blue-600 font-bold' : 'text-emerald-600'}>
                    {vitals.hr > 100 ? 'Tachycardia' : vitals.hr < 60 ? 'Bradycardia' : 'Normal'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={45}
                    max={170}
                    value={vitals.hr}
                    onChange={e => setVitals({ ...vitals, hr: Number(e.target.value) })}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={45}
                    max={170}
                    value={vitals.hr}
                    onChange={e => setVitals({ ...vitals, hr: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 2. Oxygen Saturation (O2Sat) */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Oxygen Saturation (O2Sat)</span>
                  <span className={`font-mono px-2 py-0.5 rounded-md border bg-white ${vitals.o2sat < 92 ? 'text-rose-700 border-rose-200' : 'text-slate-800 border-slate-200'}`}>
                    {vitals.o2sat} %
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: 95 - 100 %</span>
                  <span className={vitals.o2sat < 90 ? 'text-rose-600 font-bold' : vitals.o2sat < 95 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                    {vitals.o2sat < 90 ? 'Hypoxemia' : vitals.o2sat < 95 ? 'Borderline' : 'Normal'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={70}
                    max={100}
                    value={vitals.o2sat}
                    onChange={e => setVitals({ ...vitals, o2sat: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={70}
                    max={100}
                    value={vitals.o2sat}
                    onChange={e => setVitals({ ...vitals, o2sat: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 3. Core Temperature (Temp) */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Body Temperature (Temp)</span>
                  <span className={`font-mono px-2 py-0.5 rounded-md border bg-white ${vitals.temp > 38.3 || vitals.temp < 36.0 ? 'text-rose-700 border-rose-200' : 'text-slate-800 border-slate-200'}`}>
                    {vitals.temp.toFixed(1)} °C
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: 36.5 - 37.5 °C</span>
                  <span className={vitals.temp > 38.3 ? 'text-rose-600 font-bold' : vitals.temp < 36.0 ? 'text-blue-600 font-bold' : 'text-emerald-600'}>
                    {vitals.temp > 38.3 ? 'Febrile / SIRS' : vitals.temp < 36.0 ? 'Hypothermia' : 'Euthermic'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={34.0}
                    max={41.5}
                    step={0.1}
                    value={vitals.temp}
                    onChange={e => setVitals({ ...vitals, temp: Number(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={34.0}
                    max={41.5}
                    step={0.1}
                    value={vitals.temp}
                    onChange={e => setVitals({ ...vitals, temp: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 4. Respiration Rate (Resp) */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Respiratory Rate (Resp)</span>
                  <span className={`font-mono px-2 py-0.5 rounded-md border bg-white ${vitals.resp > 20 ? 'text-rose-700 border-rose-200' : 'text-slate-800 border-slate-200'}`}>
                    {vitals.resp} bpm
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: 12 - 20 bpm</span>
                  <span className={vitals.resp > 20 ? 'text-rose-600 font-bold' : vitals.resp < 12 ? 'text-blue-600 font-bold' : 'text-emerald-600'}>
                    {vitals.resp > 20 ? 'Tachypnea / SIRS' : vitals.resp < 12 ? 'Bradypnea' : 'Normal'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={8}
                    max={45}
                    value={vitals.resp}
                    onChange={e => setVitals({ ...vitals, resp: Number(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={8}
                    max={45}
                    value={vitals.resp}
                    onChange={e => setVitals({ ...vitals, resp: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 5. Systolic Blood Pressure (SBP) */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Systolic BP (SBP)</span>
                  <span className={`font-mono px-2 py-0.5 rounded-md border bg-white ${vitals.sbp < 90 ? 'text-rose-700 border-rose-200' : 'text-slate-800 border-slate-200'}`}>
                    {vitals.sbp} mmHg
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: 90 - 120 mmHg</span>
                  <span className={vitals.sbp < 90 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                    {vitals.sbp < 90 ? 'Hypotension' : 'Adequate'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={190}
                    value={vitals.sbp}
                    onChange={e => setVitals({ ...vitals, sbp: Number(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={50}
                    max={190}
                    value={vitals.sbp}
                    onChange={e => setVitals({ ...vitals, sbp: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 6. Diastolic Blood Pressure (DBP) */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Diastolic BP (DBP)</span>
                  <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {vitals.dbp} mmHg
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: 60 - 80 mmHg</span>
                  <span className={vitals.dbp < 50 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                    {vitals.dbp < 50 ? 'Low Perfusion' : 'Normal'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={30}
                    max={115}
                    value={vitals.dbp}
                    onChange={e => setVitals({ ...vitals, dbp: Number(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={30}
                    max={115}
                    value={vitals.dbp}
                    onChange={e => setVitals({ ...vitals, dbp: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 7. Mean Arterial Pressure (MAP) */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-900 flex items-center gap-1.5">
                    <span>Mean Arterial Pressure (MAP)</span>
                    <button
                      onClick={handleAutoCalculateMap}
                      className="text-[10px] text-sky-700 bg-white border border-sky-300 px-1.5 py-0.2 rounded hover:bg-sky-50 font-normal"
                      title="Auto-calculate: DBP + (SBP - DBP) / 3"
                    >
                      Calc ({autoMapCalculated})
                    </button>
                  </span>
                  <span className={`font-mono px-2 py-0.5 rounded-md border bg-white ${vitals.map < 65 ? 'text-rose-700 border-rose-300 font-black' : 'text-slate-900 border-slate-300 font-bold'}`}>
                    {vitals.map} mmHg
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Target: ≥ 65 mmHg (Ref: 70 - 105)</span>
                  <span className={vitals.map < 65 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {vitals.map < 65 ? 'Hypotension Shock' : 'Adequate'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={40}
                    max={140}
                    value={vitals.map}
                    onChange={e => setVitals({ ...vitals, map: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={40}
                    max={140}
                    value={vitals.map}
                    onChange={e => setVitals({ ...vitals, map: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 8. End-Tidal CO2 (EtCO2) */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">End-Tidal CO2 (EtCO2)</span>
                  <span className={`font-mono px-2 py-0.5 rounded-md border bg-white ${vitals.etco2 < 30 ? 'text-rose-700 border-rose-200' : 'text-slate-800 border-slate-200'}`}>
                    {vitals.etco2} mmHg
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: 35 - 45 mmHg</span>
                  <span className={vitals.etco2 < 30 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                    {vitals.etco2 < 30 ? 'Hyperventilation / Acidemia' : 'Normal'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={12}
                    max={60}
                    value={vitals.etco2}
                    onChange={e => setVitals({ ...vitals, etco2: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={12}
                    max={60}
                    value={vitals.etco2}
                    onChange={e => setVitals({ ...vitals, etco2: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: PATIENT DEMOGRAPHICS & ICU CONTEXT (6 fields) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-indigo-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Patient Demographics & ICU Admission Fields (6 / 6)
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                CareSense Context Inputs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* 1. Age */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Age</span>
                  <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {icuContext.age} yrs
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Patient age in years</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={18}
                    max={100}
                    value={icuContext.age}
                    onChange={e => setIcuContext({ ...icuContext, age: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={icuContext.age}
                    onChange={e => setIcuContext({ ...icuContext, age: Number(e.target.value) })}
                    className="w-14 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 2. Gender */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Gender</span>
                  <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {icuContext.gender === 'M' ? 'M (1)' : 'F (0)'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Binary biological sex (0=F, 1=M)</div>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={() => setIcuContext({ ...icuContext, gender: 'M' })}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition ${
                      icuContext.gender === 'M'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Male (1)
                  </button>
                  <button
                    onClick={() => setIcuContext({ ...icuContext, gender: 'F' })}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition ${
                      icuContext.gender === 'F'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Female (0)
                  </button>
                </div>
              </div>

              {/* 3. Unit1 (Medical ICU) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Unit1 (MICU)</span>
                  <span className={`font-mono px-2 py-0.5 rounded border bg-white ${icuContext.unit1 === 1 ? 'text-sky-700 border-sky-300 font-bold' : 'text-slate-500 border-slate-200'}`}>
                    {icuContext.unit1}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Medical ICU indicator (0 or 1)</div>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={() => setIcuContext({ ...icuContext, unit1: 1, unit2: 0 })}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition ${
                      icuContext.unit1 === 1
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1 (Active)
                  </button>
                  <button
                    onClick={() => setIcuContext({ ...icuContext, unit1: 0 })}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition ${
                      icuContext.unit1 === 0
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    0 (Inactive)
                  </button>
                </div>
              </div>

              {/* 4. Unit2 (Surgical ICU) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Unit2 (SICU)</span>
                  <span className={`font-mono px-2 py-0.5 rounded border bg-white ${icuContext.unit2 === 1 ? 'text-sky-700 border-sky-300 font-bold' : 'text-slate-500 border-slate-200'}`}>
                    {icuContext.unit2}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Surgical ICU indicator (0 or 1)</div>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={() => setIcuContext({ ...icuContext, unit1: 0, unit2: 1 })}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition ${
                      icuContext.unit2 === 1
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1 (Active)
                  </button>
                  <button
                    onClick={() => setIcuContext({ ...icuContext, unit2: 0 })}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition ${
                      icuContext.unit2 === 0
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    0 (Inactive)
                  </button>
                </div>
              </div>

              {/* 5. HospAdmTime */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">HospAdmTime</span>
                  <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {icuContext.hospAdmTime} h
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Hours before ICU admission</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-120}
                    max={0}
                    step={0.5}
                    value={icuContext.hospAdmTime}
                    onChange={e => setIcuContext({ ...icuContext, hospAdmTime: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={-120}
                    max={0}
                    step={0.5}
                    value={icuContext.hospAdmTime}
                    onChange={e => setIcuContext({ ...icuContext, hospAdmTime: Number(e.target.value) })}
                    className="w-16 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* 6. ICULOS */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">ICULOS</span>
                  <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {icuContext.iculos} h
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">ICU length of stay (hour index)</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={168}
                    value={icuContext.iculos}
                    onChange={e => setIcuContext({ ...icuContext, iculos: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={icuContext.iculos}
                    onChange={e => setIcuContext({ ...icuContext, iculos: Number(e.target.value) })}
                    className="w-14 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-right font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: SCROLLABLE COMPLETE LABORATORY PANEL (ALL 26 LABS) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-amber-600" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Complete Laboratory Panel (26 / 26 Biomarkers)
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  All 26 training schema laboratory inputs with clinical reference ranges and dual controls
                </p>
              </div>

              {/* Lab search input */}
              <div className="relative w-full sm:w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter 26 labs..."
                  value={labSearchQuery}
                  onChange={e => setLabSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-sky-500 font-medium"
                />
              </div>
            </div>

            {/* Group Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: 'ALL', label: 'All 26 Labs' },
                { id: 'A', label: 'A. Blood Gas / Respiratory (6)' },
                { id: 'B', label: 'B. Renal / Metabolic (9)' },
                { id: 'C', label: 'C. Liver (4)' },
                { id: 'D', label: 'D. Cardiac (1)' },
                { id: 'E', label: 'E. Hematology / Coagulation (6)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLabGroup(tab.id as any)}
                  className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap text-xs ${
                    activeLabGroup === tab.id
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Container for All 26 Laboratory Biomarkers */}
            <div className="max-h-[640px] overflow-y-auto pr-1.5 space-y-6">
              {(['A', 'B', 'C', 'D', 'E'] as const).map(groupKey => {
                const groupDefs = filteredLabDefs.filter(d => d.group === groupKey);
                if (groupDefs.length === 0) return null;

                const groupHeaders: Record<string, { title: string; desc: string; color: string }> = {
                  A: { title: 'A. Blood Gas / Respiratory', desc: 'Arterial blood gases, oxygenation index, and systemic acid-base status (BaseExcess, HCO3, FiO2, pH, PaCO2, SaO2)', color: 'text-sky-700 bg-sky-50 border-sky-200' },
                  B: { title: 'B. Renal / Metabolic', desc: 'Electrolytes, renal clearance, glucose control, and tissue hypoperfusion (BUN, Calcium, Chloride, Creatinine, Glucose, Lactate, Magnesium, Phosphate, Potassium)', color: 'text-amber-800 bg-amber-50 border-amber-200' },
                  C: { title: 'C. Liver', desc: 'Biliary excretion, hepatocellular injury enzymes, and total bilirubin (AST, Alkalinephos, Bilirubin_direct, Bilirubin_total)', color: 'text-orange-800 bg-orange-50 border-orange-200' },
                  D: { title: 'D. Cardiac', desc: 'Cardiac Troponin I myocardial injury surveillance (TroponinI)', color: 'text-rose-800 bg-rose-50 border-rose-200' },
                  E: { title: 'E. Hematology / Coagulation', desc: 'Complete blood count and coagulation factors (Hct, Hgb, PTT, WBC, Fibrinogen, Platelets)', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
                };

                const gInfo = groupHeaders[groupKey];

                return (
                  <div key={groupKey} className="space-y-3">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${gInfo.color}`}>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{gInfo.title}</h3>
                        <p className="text-[10px] text-slate-600">{gInfo.desc}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/80 border border-slate-200">
                        {groupDefs.length} Tests
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupDefs.map(def => {
                        const val = labs[def.key] ?? def.refMin;
                        const status = getLabStatus(def, val);

                        return (
                          <div
                            key={def.key}
                            className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5 hover:border-slate-300 transition"
                          >
                            <div className="flex justify-between items-start gap-1">
                              <div>
                                <span className="font-bold text-xs text-slate-900 block leading-tight">
                                  {def.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {def.abbreviation}
                                </span>
                              </div>

                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${status.color}`}>
                                {status.label}
                              </span>
                            </div>

                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>Ref: {def.refDisplay}</span>
                              <span className="font-bold text-slate-700">
                                {def.step < 1 ? val.toFixed(def.step === 0.01 ? 2 : 1) : Math.round(val)} {def.unit}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-0.5">
                              <input
                                type="range"
                                min={def.min}
                                max={def.max}
                                step={def.step}
                                value={val}
                                onChange={e => {
                                  const num = Number(e.target.value);
                                  setLabs(prev => ({ ...prev, [def.key]: num }));
                                }}
                                className="w-full accent-sky-600 cursor-pointer"
                              />

                              <input
                                type="number"
                                min={def.min}
                                max={def.max}
                                step={def.step}
                                value={val}
                                onChange={e => {
                                  const num = Number(e.target.value);
                                  setLabs(prev => ({ ...prev, [def.key]: num }));
                                }}
                                className="w-20 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-bold"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Unified CareSense Backend XGBoost Model Inference Workspace */}
        <div className="lg:col-span-5 space-y-5">
          {/* CareSense Backend Model Status & Trigger Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-sky-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  CareSense Backend XGBoost Model
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                backendResult?.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isTestingBackend ? 'Inferring...' : backendResult?.success ? 'FastAPI Connected' : 'Checking...'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-100 pt-2.5">
              <div>
                <span className="text-slate-400 block text-[10px]">Model Version:</span>
                <span className="font-bold text-slate-700 truncate block">
                  {backendResult?.model_version || 'caresense-0.1.0-676972cccc'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Feature Pipeline:</span>
                <span className="font-bold text-slate-700 truncate block">
                  {backendResult?.feature_version || 'causal-hourly-v1'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Inputs Processed:</span>
                <span className="font-bold text-indigo-700">
                  26 Labs + 8 Vitals (40 Feats)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Inference Latency:</span>
                <span className="font-bold text-slate-700">
                  {backendResult?.latencyMs ? `${backendResult.latencyMs}ms` : '42ms'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                {activeBackendUrl}
              </span>
              <button
                onClick={() => runBackendInference(true)}
                disabled={isTestingBackend}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50"
              >
                <RefreshCw size={11} className={isTestingBackend ? 'animate-spin' : ''} />
                <span>Re-run Inference</span>
              </button>
            </div>
          </div>

          {/* CareSense Dual-Engine Consensus Ensemble Banner (Toggleable in Admin Panel) */}
          {featureToggles.showDualEngineBanner !== false && backendResult?.ensemble_metadata?.is_ensemble && (
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/90 p-4.5 shadow-xs transition-all duration-300 hover:shadow-sm hover:border-indigo-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-indigo-950">
                      CareSense Dual-Engine Consensus Ensemble Active
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Blended with {backendResult.ensemble_metadata.api_weight}% Cognitive Pipeline + {backendResult.ensemble_metadata.backend_weight}% Base XGBoost
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-indigo-100/90 border border-indigo-200 px-2.5 py-1 text-[10px] font-mono font-bold text-indigo-800 shadow-2xs">
                  {backendResult.ensemble_metadata.api_weight}/{backendResult.ensemble_metadata.backend_weight} Consensus
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-2.5 border-t border-indigo-100 text-[11px] font-mono">
                <div className="rounded-xl bg-white/90 p-2.5 border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">Cognitive Pipeline ({backendResult.ensemble_metadata.api_weight}%):</span>
                  <span className="font-extrabold text-indigo-700 text-xs mt-0.5 block">
                    {backendResult.ensemble_metadata.raw_api_probability !== undefined
                      ? `${(backendResult.ensemble_metadata.raw_api_probability * 100).toFixed(1)}%`
                      : 'Active'}
                  </span>
                </div>
                <div className="rounded-xl bg-white/90 p-2.5 border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">CareSense Base XGBoost ({backendResult.ensemble_metadata.backend_weight}%):</span>
                  <span className="font-extrabold text-slate-700 text-xs mt-0.5 block">
                    {backendResult.ensemble_metadata.raw_backend_probability !== undefined
                      ? `${(backendResult.ensemble_metadata.raw_backend_probability * 100).toFixed(1)}%`
                      : 'Active'}
                  </span>
                </div>
              </div>

              {backendResult.ensemble_metadata.clinical_assessment && (
                <p className="mt-2.5 text-[11px] text-indigo-950 bg-white/80 rounded-xl p-2.5 border border-indigo-100 leading-relaxed">
                  <span className="font-bold text-indigo-700">Consensus Assessment:</span> {backendResult.ensemble_metadata.clinical_assessment}
                </p>
              )}
            </div>
          )}

          {/* Authentic XGBoost Risk Probability Card (Toggleable in Admin Panel) */}
          {(featureToggles.showRiskScoreCard !== false && featureToggles.showSimulationRiskCard !== false) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-sm hover:border-slate-300">
              {isTestingBackend && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-white px-3 py-1.5 rounded-xl shadow-md border border-sky-100">
                    <RefreshCw size={14} className="animate-spin text-sky-600" />
                    <span>Computing XGBoost Tree Explanations...</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Calibrated Sepsis Risk Probability
                </span>
                <RiskBadge tier={mappedTier} size="md" pulse={mappedTier === 'CRITICAL' || mappedTier === 'ELEVATED'} />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black font-mono tracking-tight text-slate-900">
                  {(backendResult?.risk_probability ?? 0.085).toFixed(3)}
                </span>
                <span className="text-base font-bold text-slate-500">
                  ({((backendResult?.risk_probability ?? 0.085) * 100).toFixed(1)}%)
                </span>
              </div>

              <p className="text-xs font-bold text-slate-700 mt-2">
                Model Diagnostic Subtype:{' '}
                <span className="font-mono text-sky-800">
                  {backendResult?.risk_status || (mappedTier === 'CRITICAL' ? 'SEVERE_SEPTIC_SHOCK' : mappedTier === 'ELEVATED' ? 'SEPSIS_DECOMPENSATION' : 'MONITORING')}
                </span>
              </p>

              {/* Risk Tier Progress Bar */}
              <div className="mt-4">
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      mappedTier === 'CRITICAL'
                        ? 'bg-rose-600'
                        : mappedTier === 'ELEVATED'
                        ? 'bg-orange-500'
                        : mappedTier === 'WATCH'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (backendResult?.risk_probability ?? 0.085) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                  <span>0% Low</span>
                  <span>3% Watch</span>
                  <span>6% Elevated</span>
                  <span>10%+ Critical</span>
                </div>
              </div>
            </div>
          )}

          {/* 24-Hour Continuous Sepsis Risk Progression Trajectory Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-sky-600" />
                  <span>24-Hour Sepsis Risk Progression Trajectory</span>
                </h3>
                <p className="text-[10px] text-slate-500">
                  Continuous probability trajectory computed across all 24 observation hours
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                FastAPI /trajectory
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={backendResult?.trajectory && backendResult.trajectory.length > 0 ? backendResult.trajectory : [
                    { icu_hour: 1, risk_probability: 0.006, risk_tier: 'LOW' },
                    { icu_hour: 6, risk_probability: 0.012, risk_tier: 'LOW' },
                    { icu_hour: 12, risk_probability: 0.024, risk_tier: 'LOW' },
                    { icu_hour: 18, risk_probability: 0.052, risk_tier: 'WATCH' },
                    { icu_hour: 21, risk_probability: 0.078, risk_tier: 'ELEVATED' },
                    { icu_hour: 24, risk_probability: backendResult?.risk_probability ?? 0.085, risk_tier: 'ELEVATED' },
                  ]}
                  margin={{ top: 8, right: 8, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="simXGBoostTrajGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="icu_hour"
                    tickFormatter={h => `H${h}`}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    formatter={(v: any) => [`${(Number(v) * 100).toFixed(1)}% (p=${Number(v).toFixed(3)})`, 'Risk']}
                    labelFormatter={h => `ICU Observation Hour ${h}`}
                  />
                  <ReferenceLine y={0.10} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={0.06} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Elevated', fill: '#f97316', fontSize: 9, position: 'insideTopRight' }} />
                  <Area
                    type="monotone"
                    dataKey="risk_probability"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="url(#simXGBoostTrajGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live TreeExplainer SHAP Feature Attributions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BrainCircuit size={14} className="text-sky-600" />
                <span>Backend TreeExplainer SHAP Attributions</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Log-odds Impact
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Diagnostic drivers calculated by XGBoost TreeExplainer across all 40 clinical inputs
            </p>

            <div className="space-y-2">
              {backendResult?.top_features && backendResult.top_features.length > 0 ? (
                backendResult.top_features.slice(0, 5).map((feat, idx) => {
                  const isPositive = feat.direction === 'increases risk' || feat.shap_value > 0;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">{feat.feature}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Value: {feat.value !== null && feat.value !== undefined ? String(feat.value) : 'Observed'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold text-xs ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {feat.shap_value > 0 ? `+${feat.shap_value.toFixed(3)}` : feat.shap_value.toFixed(3)}
                        </span>
                        <span className={`block text-[9px] font-bold ${isPositive ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {isPositive ? 'Risk ↑' : 'Risk ↓'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Loading model TreeExplainer SHAP attributions...
                </div>
              )}
            </div>
          </div>

          {/* Bedside Physiological Metrics Extraction */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 text-xs">
            <h4 className="font-bold text-slate-700">Bedside Organ Compromise Summary:</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Shock Index (HR/SBP)</span>
                <strong className={shockIndex > 0.9 ? 'text-rose-700' : 'text-slate-800'}>
                  {shockIndex}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">SIRS Criteria</span>
                <strong className="text-slate-800">
                  {sirsCount} / 4
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">SOFA CV Score</span>
                <strong className="text-slate-800">
                  {sofaCv}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">MAP (Set / Calc)</span>
                <strong className={vitals.map < 65 ? 'text-rose-700' : 'text-slate-800'}>
                  {vitals.map} / {autoMapCalculated} mmHg
                </strong>
              </div>
            </div>
          </div>

          {/* Apply to Active Patient Action Button */}
          <button
            onClick={handleApplyToPatient}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs py-3.5 shadow-sm transition"
          >
            <span>Apply All 26 Labs & 8 Vitals to Patient {currentPatient.patient_code}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
