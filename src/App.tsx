import React, { useState } from 'react';
import { CareSenseProvider, useCareSense } from './hooks/useCareSense';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { OfflineIndicator } from './components/common/OfflineIndicator';

import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { RiskMonitoringView } from './views/RiskMonitoringView';
import { AlertsView } from './views/AlertsView';
import { AnalyticsView } from './views/AnalyticsView';
import { ModelInsightsView } from './views/ModelInsightsView';
import { SimulationLabView } from './views/SimulationLabView';
import { PrototypeStreamView } from './views/PrototypeStreamView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AdminPanelView } from './views/AdminPanelView';
import { MetricHistoryModal } from './components/common/MetricHistoryModal';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    activeMetricHistory,
    isMetricHistoryOpen,
    closeMetricHistory,
    activePatientData,
  } = useCareSense();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* Persistent Offline Banner (shows only when connection drops) */}
      <OfflineIndicator variant="banner" />

      {/* Metric History Micro-Window Popup Modal */}
      <MetricHistoryModal
        data={activeMetricHistory}
        isOpen={isMetricHistoryOpen}
        onClose={closeMetricHistory}
        patientCode={activePatientData?.patient.patient_code}
        icuBed={activePatientData?.patient.icu_bed}
      />

      {/* Side Navigation Bar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <Header onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)} />

        {/* View Routing */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'patients' && <PatientsView />}
          {activeTab === 'risk-monitoring' && <RiskMonitoringView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'model-insights' && <ModelInsightsView />}
          {activeTab === 'simulation' && <SimulationLabView />}
          {activeTab === 'prototype' && <PrototypeStreamView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'admin' && <AdminPanelView />}
        </main>

        {/* Clinical Disclaimer Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <CareSenseProvider>
      <MainLayout />
    </CareSenseProvider>
  );
}
