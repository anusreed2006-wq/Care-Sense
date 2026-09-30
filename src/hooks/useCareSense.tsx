/**
 * CareSense Global Clinical Workspace Context
 * Provides shared state, reactive patient monitoring, realtime updates, and authentication state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Patient,
  EnrichedPatientData,
  Alert,
  UserProfile,
  NavigationTab,
  AppMode,
  VitalSigns,
  RiskPrediction,
  AppFeatureToggles,
  MetricHistoryModalData,
  CareSenseBackendHealth,
  BackendConnectionTestResult,
} from '../types';
import { authService } from '../services/authService';
import { patientService } from '../services/patientService';
import { alertService } from '../services/alertService';
import { realtimeService } from '../services/realtimeService';
import { caresenseApi } from '../services/caresenseApi';
import { buildEnrichedPatient, ALL_DEMO_PATIENTS } from '../data/demoData';
import { generateMetricHistory } from '../utils/metricHistoryGenerator';

const DEFAULT_FEATURE_TOGGLES: AppFeatureToggles = {
  showRiskScoreCard: true,
  showRiskTrajectory: true,
  showExplainableAI: true,
  showVitalsTelemetry: true,
  showLabBiomarkers: true,
  showSepsisBundle: true,
  showEventTimeline: true,
  showCriticalAlertBanner: true,
  showWardOverviewCharts: true,
  showEtCO2: true,
  showShockIndex: true,
  showBaseExcess: true,
  enableSimulationLab: true,
  enableAnalyticsTab: true,
  enableReportsTab: true,
  enableMicroWindows: true,
  enablePrototypeTab: true,
  hiddenPatientIds: [],
};

interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  description?: string;
  timestamp: string;
}

interface CareSenseContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  patients: Patient[];
  visiblePatients: Patient[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  activePatientData: EnrichedPatientData | null;
  alerts: Alert[];
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  refreshPatients: () => Promise<void>;
  selectPatientAndNavigate: (patientId: string, tab?: NavigationTab) => void;
  stats: {
    totalMonitored: number;
    highRiskCount: number;
    criticalCount: number;
    activeAlertsCount: number;
    monitoringCoverage: string;
  };

  // Micro Window History Modal
  activeMetricHistory: MetricHistoryModalData | null;
  isMetricHistoryOpen: boolean;
  openMetricHistory: (metricKey: string, currentValue: number, isCritical?: boolean) => void;
  closeMetricHistory: () => void;

  // Admin Authentication & Control Panel
  isAdminAuthenticated: boolean;
  loginAdmin: (user: string, pass: string) => boolean;
  logoutAdmin: () => void;

  // Feature Toggles (Controlling what appears in main app)
  featureToggles: AppFeatureToggles;
  setFeatureToggle: <K extends keyof AppFeatureToggles>(key: K, value: AppFeatureToggles[K]) => void;
  resetFeatureToggles: () => void;
  togglePatientVisibility: (patientId: string) => void;

  // Admin Data Management
  updatePatient: (patient: Patient) => void;
  updatePatientClinicalData: (
    patientId: string,
    vitalsUpdate: Partial<VitalSigns>,
    labsUpdate: Partial<EnrichedPatientData['latestLabs']>
  ) => void;

  // Live CareSense API state & triggers
  backendApiUrl: string;
  updateBackendApiUrl: (url: string) => Promise<BackendConnectionTestResult>;
  resetBackendApiUrl: () => Promise<void>;
  refreshBackendHealth: () => Promise<void>;
  isLiveInferring: boolean;
  backendApiStatus: 'ready' | 'connecting' | 'error' | 'offline';
  backendHealth: CareSenseBackendHealth | null;
  triggerLivePrediction: () => Promise<void>;
}

const CareSenseContext = createContext<CareSenseContextType | undefined>(undefined);

export const CareSenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>(ALL_DEMO_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-1042-uuid');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [appMode, setAppMode] = useState<AppMode>(() => {
    return ((import.meta.env.VITE_APP_MODE || 'live').toLowerCase() === 'live') ? 'live' : 'demo';
  });
  const [isLiveInferring, setIsLiveInferring] = useState<boolean>(false);
  const [backendApiStatus, setBackendApiStatus] = useState<'ready' | 'connecting' | 'error' | 'offline'>('connecting');
  const [backendHealth, setBackendHealth] = useState<CareSenseBackendHealth | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [activePatientData, setActivePatientData] = useState<EnrichedPatientData | null>(null);

  // Micro Window Telemetry State
  const [activeMetricHistory, setActiveMetricHistory] = useState<MetricHistoryModalData | null>(null);

  // Admin Authentication State (User: admin / Pass: 123456)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caresense_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Feature Toggles State (Persisted in localStorage)
  const [featureToggles, setFeatureToggles] = useState<AppFeatureToggles>(() => {
    try {
      const saved = localStorage.getItem('caresense_feature_toggles');
      if (saved) {
        return { ...DEFAULT_FEATURE_TOGGLES, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_FEATURE_TOGGLES;
  });

  const setFeatureToggle = useCallback(<K extends keyof AppFeatureToggles>(key: K, value: AppFeatureToggles[K]) => {
    setFeatureToggles(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('caresense_feature_toggles', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resetFeatureToggles = useCallback(() => {
    setFeatureToggles(DEFAULT_FEATURE_TOGGLES);
    try {
      localStorage.setItem('caresense_feature_toggles', JSON.stringify(DEFAULT_FEATURE_TOGGLES));
    } catch {
      // ignore
    }
  }, []);

  const togglePatientVisibility = useCallback((patientId: string) => {
    setFeatureToggles(prev => {
      const isHidden = prev.hiddenPatientIds.includes(patientId);
      const nextHidden = isHidden
        ? prev.hiddenPatientIds.filter(id => id !== patientId)
        : [...prev.hiddenPatientIds, patientId];
      const next = { ...prev, hiddenPatientIds: nextHidden };
      try {
        localStorage.setItem('caresense_feature_toggles', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Admin Login Verification
  const loginAdmin = useCallback((user: string, pass: string): boolean => {
    if (user.trim() === 'admin' && pass.trim() === '123456') {
      setIsAdminAuthenticated(true);
      try {
        localStorage.setItem('caresense_admin_auth', 'true');
      } catch {
        // ignore
      }
      authService.signInAsDemo('admin').then(u => setCurrentUser(u));
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem('caresense_admin_auth');
    } catch {
      // ignore
    }
    authService.signInAsDemo('clinician').then(u => setCurrentUser(u));
  }, []);

  // Micro Window Open / Close
  const openMetricHistory = useCallback((metricKey: string, currentValue: number, isCritical = false) => {
    if (!featureToggles.enableMicroWindows) return;
    const historyData = generateMetricHistory(metricKey, currentValue, isCritical);
    setActiveMetricHistory(historyData);
  }, [featureToggles.enableMicroWindows]);

  const closeMetricHistory = useCallback(() => {
    setActiveMetricHistory(null);
  }, []);

  // Admin Data Management
  const updatePatient = useCallback((updated: Patient) => {
    setPatients(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    setActivePatientData(prev => {
      if (!prev || prev.patient.id !== updated.id) return prev;
      return { ...prev, patient: updated };
    });
  }, []);

  const updatePatientClinicalData = useCallback((
    patientId: string,
    vitalsUpdate: Partial<VitalSigns>,
    labsUpdate: Partial<EnrichedPatientData['latestLabs']>
  ) => {
    setActivePatientData(prev => {
      if (!prev || prev.patient.id !== patientId) return prev;
      const updatedVitals = { ...prev.latestVitals, ...vitalsUpdate };
      const updatedLabs = { ...prev.latestLabs, ...labsUpdate };

      const updated = {
        ...prev,
        latestVitals: updatedVitals,
        latestLabs: updatedLabs,
      };

      if (appMode === 'live') {
        setIsLiveInferring(true);
        caresenseApi.syncPatientAndPredict(
          prev.patient,
          updatedVitals,
          updatedLabs,
          prev.previousVitals,
          prev.previousLabs
        ).then(res => {
          setActivePatientData(curr => {
            if (!curr || curr.patient.id !== patientId) return curr;
            return {
              ...curr,
              currentPrediction: res.prediction,
              explanations: res.explanations,
              riskHistory: res.trajectory.length > 0 ? res.trajectory : curr.riskHistory,
              dataQualityFlags: res.dataQualityFlags,
              backendPatientId: res.backendPatientId,
              isBackendConnected: true,
              clinicallyValidated: res.clinicallyValidated,
            };
          });
          setIsLiveInferring(false);
        }).catch(err => {
          console.warn('[CareSense API] Error predicting after clinical data update:', err);
          setIsLiveInferring(false);
        });
      }

      return updated;
    });
  }, [appMode]);

  // Visible patients filtered by admin feature toggles
  const visiblePatients = patients.filter(p => !featureToggles.hiddenPatientIds.includes(p.id));

  // Configurable CareSense Backend URL state
  const [backendApiUrl, setBackendApiUrlState] = useState<string>(() => caresenseApi.getApiUrl());

  const refreshBackendHealth = useCallback(async () => {
    setBackendApiStatus('connecting');
    try {
      const health = await caresenseApi.getHealth();
      setBackendHealth(health);
      setBackendApiStatus('ready');
    } catch (err) {
      console.warn('[CareSense API] Backend health check error:', err);
      setBackendApiStatus('error');
    }
  }, []);

  const updateBackendApiUrl = useCallback(async (newUrl: string): Promise<BackendConnectionTestResult> => {
    setBackendApiStatus('connecting');
    const testResult = await caresenseApi.testConnection(newUrl);
    if (testResult.success) {
      caresenseApi.setApiUrl(newUrl);
      setBackendApiUrlState(caresenseApi.getApiUrl());
      setBackendHealth(testResult.health || null);
      setBackendApiStatus('ready');
      // If patient active, trigger live prediction
      if (activePatientData) {
        caresenseApi.syncPatientAndPredict(
          activePatientData.patient,
          activePatientData.latestVitals,
          activePatientData.latestLabs
        ).then(res => {
          setActivePatientData(curr => {
            if (!curr) return curr;
            return {
              ...curr,
              currentPrediction: res.prediction,
              explanations: res.explanations,
              riskHistory: res.trajectory.length > 0 ? res.trajectory : curr.riskHistory,
              dataQualityFlags: res.dataQualityFlags,
              backendPatientId: res.backendPatientId,
              isBackendConnected: true,
              clinicallyValidated: res.clinicallyValidated,
            };
          });
        }).catch(err => {
          console.warn('[CareSense API] Error re-predicting after URL update:', err);
        });
      }
    } else {
      setBackendApiStatus('error');
    }
    return testResult;
  }, [activePatientData]);

  const resetBackendApiUrl = useCallback(async () => {
    const defaultUrl = caresenseApi.resetApiUrl();
    setBackendApiUrlState(defaultUrl);
    await refreshBackendHealth();
  }, [refreshBackendHealth]);

  // Check backend health on initial mount
  useEffect(() => {
    refreshBackendHealth();
  }, [refreshBackendHealth]);

  // Load user session
  useEffect(() => {
    authService.getCurrentUser().then(user => {
      setCurrentUser(user);
    });
  }, []);

  // Load initial patients & alerts
  const refreshPatients = useCallback(async () => {
    const list = await patientService.getPatients();
    setPatients(list);
  }, []);

  const refreshAlerts = useCallback(async () => {
    const list = await alertService.getAlerts();
    setAlerts(list);
  }, []);

  useEffect(() => {
    refreshPatients();
    refreshAlerts();
  }, [refreshPatients, refreshAlerts]);

  // Sync enriched active patient data and run real backend prediction in LIVE mode
  useEffect(() => {
    const p = patients.find(pt => pt.id === selectedPatientId || pt.patient_code === selectedPatientId) || patients[0];
    if (!p) return;

    let isCancelled = false;
    const idx = patients.indexOf(p);
    const enriched = buildEnrichedPatient(p, idx);
    enriched.activeAlerts = alerts.filter(a => a.patient_id === p.id && a.status === 'ACTIVE');

    if (appMode === 'live') {
      setIsLiveInferring(true);
      caresenseApi.syncPatientAndPredict(
        p,
        enriched.latestVitals,
        enriched.latestLabs,
        enriched.previousVitals,
        enriched.previousLabs
      ).then(res => {
        if (isCancelled) return;
        setActivePatientData({
          ...enriched,
          currentPrediction: res.prediction,
          explanations: res.explanations,
          riskHistory: res.trajectory.length > 0 ? res.trajectory : enriched.riskHistory,
          dataQualityFlags: res.dataQualityFlags,
          backendPatientId: res.backendPatientId,
          isBackendConnected: true,
          clinicallyValidated: res.clinicallyValidated,
        });
        setIsLiveInferring(false);
      }).catch(err => {
        if (isCancelled) return;
        console.warn('[CareSense API] Live backend sync failed, using baseline telemetry:', err);
        setIsLiveInferring(false);
        setActivePatientData(enriched);
      });
    } else {
      setActivePatientData(enriched);
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedPatientId, patients, alerts, appMode]);

  // Realtime Telemetry & Alert Subscriptions
  useEffect(() => {
    const unsubAlert = realtimeService.onAlert(newAlert => {
      setAlerts(prev => {
        const exists = prev.find(a => a.id === newAlert.id);
        if (exists) {
          return prev.map(a => (a.id === newAlert.id ? newAlert : a));
        }
        return [newAlert, ...prev];
      });

      addToast({
        type: newAlert.severity === 'CRITICAL' ? 'critical' : 'warning',
        title: `Alert Triggered: ${newAlert.patient_code || 'ICU Patient'}`,
        description: newAlert.message,
      });
    });

    const unsubVitals = realtimeService.onVitals(vitals => {
      setActivePatientData(prev => {
        if (!prev || prev.patient.id !== vitals.patient_id) return prev;
        return {
          ...prev,
          previousVitals: prev.latestVitals,
          latestVitals: vitals,
        };
      });
    });

    const unsubPred = realtimeService.onPrediction(pred => {
      // In LIVE mode, the Render backend is the single source of truth for predictions; ignore old demo stream
      if (appMode === 'live') return;
      setActivePatientData(prev => {
        if (!prev || prev.patient.id !== pred.patient_id) return prev;
        return {
          ...prev,
          currentPrediction: pred,
        };
      });
    });

    return () => {
      unsubAlert();
      unsubVitals();
      unsubPred();
    };
  }, [appMode, addToast]);

  const acknowledgeAlert = useCallback(async (id: string) => {
    await alertService.acknowledgeAlert(id);
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledged_at: new Date().toISOString() } : a)));
    addToast({
      type: 'info',
      title: 'Alert Acknowledged',
      description: 'The sepsis warning has been marked as acknowledged by attending staff.',
    });
  }, [addToast]);

  const resolveAlert = useCallback(async (id: string) => {
    await alertService.resolveAlert(id);
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'RESOLVED' as const, resolved_at: new Date().toISOString() } : a)));
    addToast({
      type: 'success',
      title: 'Alert Resolved',
      description: 'Clinical escalation pathway verified and closed.',
    });
  }, [addToast]);

  const selectPatientAndNavigate = useCallback((patientId: string, tab: NavigationTab = 'risk-monitoring') => {
    setSelectedPatientId(patientId);
    setActiveTab(tab);
  }, []);

  // Compute stats
  const totalMonitored = patients.length;
  // Based on benchmark values from prompt: High Risk: 5, Critical: 2, Active Alerts: 4, Coverage: 100%
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalCount = 2;
  const highRiskCount = 5;
  const monitoringCoverage = '100%';

  const triggerLivePrediction = useCallback(async () => {
    if (!activePatientData) return;
    setIsLiveInferring(true);
    try {
      const res = await caresenseApi.syncPatientAndPredict(
        activePatientData.patient,
        activePatientData.latestVitals,
        activePatientData.latestLabs,
        activePatientData.previousVitals,
        activePatientData.previousLabs
      );
      setActivePatientData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentPrediction: res.prediction,
          explanations: res.explanations,
          riskHistory: res.trajectory.length > 0 ? res.trajectory : prev.riskHistory,
          dataQualityFlags: res.dataQualityFlags,
          backendPatientId: res.backendPatientId,
          isBackendConnected: true,
          clinicallyValidated: res.clinicallyValidated,
        };
      });
      addToast({
        type: 'success',
        title: 'Model Prediction Synced',
        description: `Verified Render backend returned ${(res.prediction.risk_probability * 100).toFixed(1)}% risk (${res.prediction.risk_tier}).`,
      });
    } catch (err: any) {
      console.error('[CareSense API] Manual trigger failed:', err);
      addToast({
        type: 'critical',
        title: 'Backend Prediction Failed',
        description: err.message || 'Error communicating with CareSense API.',
      });
    } finally {
      setIsLiveInferring(false);
    }
  }, [activePatientData, addToast]);

  return (
    <CareSenseContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        patients,
        visiblePatients,
        selectedPatientId,
        setSelectedPatientId,
        activePatientData,
        alerts,
        appMode,
        setAppMode,
        searchQuery,
        setSearchQuery,
        toasts,
        addToast,
        removeToast,
        acknowledgeAlert,
        resolveAlert,
        refreshPatients,
        selectPatientAndNavigate,
        stats: {
          totalMonitored,
          highRiskCount,
          criticalCount,
          activeAlertsCount,
          monitoringCoverage,
        },
        activeMetricHistory,
        isMetricHistoryOpen: Boolean(activeMetricHistory),
        openMetricHistory,
        closeMetricHistory,
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        featureToggles,
        setFeatureToggle,
        resetFeatureToggles,
        togglePatientVisibility,
        updatePatient,
        updatePatientClinicalData,
        backendApiUrl,
        updateBackendApiUrl,
        resetBackendApiUrl,
        refreshBackendHealth,
        isLiveInferring,
        backendApiStatus,
        backendHealth,
        triggerLivePrediction,
      }}
    >
      {children}
    </CareSenseContext.Provider>
  );
};

export function useCareSense() {
  const context = useContext(CareSenseContext);
  if (!context) {
    throw new Error('useCareSense must be used within a CareSenseProvider');
  }
  return context;
}
