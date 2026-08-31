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
  const { telemetry, connectionState, chartHistory, isLive } = useTelemetry(isDemoMode, demoStatus);
  const { status, isBackendOnline, refetch: refetchStatus } = useSystemStatus(isDemoMode);
  const { alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useAlerts(isDemoMode);

  const overallStatus: TrackingStatusType =
    telemetry?.overall_status || status?.overall_status || (isBackendOnline ? 'INITIALIZING' : 'DISCONNECTED');

  const handleToggleDemo = () => {
    setIsDemoMode((prev) => !prev);
  };

  const handleChangeDemoStatus = (st: TrackingStatusType) => {
    setDemoStatus(st);
  };

  const handleResetBaseline = () => {
    // Triggers local chart reset
    if (isDemoMode) {
      setDemoStatus('INITIALIZING');
      setTimeout(() => setDemoStatus('STABLE'), 2500);
    }
  };

  const pageTitles: Record<PageId, string> = {
    monitoring: 'Live Monitoring',
    analytics: 'Analytics',
    alerts: 'Warnings & Alerts',
    system: 'System Health',
    settings: 'Settings',
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden font-sans select-none">
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
          cameraConnected={status?.camera_connected ?? false}
          modelLoaded={status?.model_loaded ?? false}
          fps={telemetry?.fps || status?.current_fps || 0}
          overallStatus={overallStatus}
          isLive={isLive || isDemoMode}
          isDemoMode={isDemoMode}
          onResetBaseline={handleResetBaseline}
        />

        {/* Dynamic Page Router Body */}
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Offline Banner if backend disconnected and not demo */}
          {!isBackendOnline && !isDemoMode && (
            <div className="bg-red-950/80 border-b border-red-800/80 p-3 px-6 text-red-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span>
                  Backend offline. Connect to FastAPI backend at <code className="bg-black/50 px-1.5 py-0.5 rounded text-white">http://localhost:8000</code> or enable Demo Mode.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDemoMode(true)}
                  className="px-2.5 py-1 rounded bg-amber-500 text-black font-semibold text-[11px] hover:bg-amber-400 transition-colors"
                >
                  Enable Demo Mode
                </button>
                <button
                  onClick={() => refetchStatus()}
                  className="p-1 text-slate-300 hover:text-white"
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
              isLive={isLive}
              isDemoMode={isDemoMode}
              demoStatus={demoStatus}
              onToggleDemo={handleToggleDemo}
              onChangeDemoStatus={handleChangeDemoStatus}
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
              connectionState={isDemoMode ? 'CONNECTED' : connectionState}
              isBackendConnected={isBackendOnline || isDemoMode}
            />
          )}

          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};
