import React, { useState } from 'react';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { MonitoringPage } from './pages/MonitoringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SystemPage } from './pages/SystemPage';
import { SettingsPage } from './pages/SettingsPage';
import { useTelemetry } from './hooks/useTelemetry';
import { useSystemStatus } from './hooks/useSystemStatus';
import { useAlerts } from './hooks/useAlerts';
import { TrackingStatusType } from './types/ivguard';
import { Radio, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('monitoring');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoStatus, setDemoStatus] = useState<TrackingStatusType>('STABLE');

  // Hooks
  const { telemetry, chartHistory, isLive } = useTelemetry(isDemoMode, demoStatus);
  const { status, isBackendOnline, refetch: refetchStatus } = useSystemStatus(isDemoMode);
  const { alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useAlerts(isDemoMode);

  const overallStatus: TrackingStatusType =
    telemetry?.overall_status || status?.overall_status || (isBackendOnline ? 'STABLE' : 'DISCONNECTED');

  const handleToggleDemo = () => {
    setIsDemoMode((prev) => !prev);
  };

  const handleChangeDemoStatus = (st: TrackingStatusType) => {
    setDemoStatus(st);
  };

  const handleResetBaseline = () => {
    if (isDemoMode) {
      setDemoStatus('INITIALIZING');
      setTimeout(() => setDemoStatus('STABLE'), 2000);
    }
  };

  const pageTitles: Record<PageId, string> = {
    monitoring: 'Live Monitoring',
    analytics: 'Analytics',
    alerts: 'Recent Alerts',
    system: 'System Health',
    settings: 'Settings',
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden font-sans select-none text-slate-900">
      {/* Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isBackendConnected={isBackendOnline || isDemoMode}
        activeAlertCount={overallStatus === 'MOVEMENT DETECTED' ? 1 : 0}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader
          currentPageTitle={pageTitles[currentPage]}
          cameraConnected={status?.camera_connected ?? (isDemoMode ? true : false)}
          modelLoaded={status?.model_loaded ?? (isDemoMode ? true : false)}
          fps={telemetry?.fps || status?.current_fps || 18.6}
          overallStatus={overallStatus}
          isLive={isLive || isDemoMode}
          isDemoMode={isDemoMode}
          onResetBaseline={handleResetBaseline}
        />

        {/* Dynamic Page Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {/* Offline Banner if backend disconnected */}
          {!isBackendOnline && !isDemoMode && (
            <div className="bg-red-50 border-b border-red-200 px-8 py-3 text-red-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                <span>
                  Backend offline. Connect to FastAPI backend at <code className="bg-red-100/80 px-1.5 py-0.5 rounded font-mono text-red-900">http://localhost:8000</code> or enable Demo Mode.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDemoMode(true)}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Enable Demo Mode
                </button>
                <button
                  onClick={() => refetchStatus()}
                  className="p-1 text-red-700 hover:text-red-900"
                  title="Retry backend connection"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {currentPage === 'monitoring' && (
            <MonitoringPage
              telemetry={telemetry}
              status={status}
              chartHistory={chartHistory}
              alerts={alerts}
              isLive={isLive}
              isDemoMode={isDemoMode}
              demoStatus={demoStatus}
              onToggleDemo={handleToggleDemo}
              onChangeDemoStatus={handleChangeDemoStatus}
              onResetBaseline={handleResetBaseline}
              onNavigateToAlerts={() => setCurrentPage('alerts')}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsPage
              status={status}
              chartHistory={chartHistory}
              telemetry={telemetry}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              isLoading={alertsLoading}
              onRefresh={refetchAlerts}
            />
          )}

          {currentPage === 'system' && (
            <SystemPage
              status={status}
              telemetry={telemetry}
              connectionState={isDemoMode ? 'CONNECTED' : (isLive ? 'CONNECTED' : 'DISCONNECTED')}
              isBackendConnected={isBackendOnline || isDemoMode}
            />
          )}

          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};
