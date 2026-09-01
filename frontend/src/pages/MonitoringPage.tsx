import React from 'react';
import { FrameTelemetry, SystemStatusResponse, TelemetryPoint, TrackingStatusType, AlertEvent } from '../types/ivguard';
import { LiveCameraFeed } from '../components/monitoring/LiveCameraFeed';
import { SystemStatusCard } from '../components/monitoring/SystemStatusCard';
import { MetricCards } from '../components/monitoring/MetricCards';
import { DisplacementChart } from '../components/monitoring/DisplacementChart';
import { TrackedObjectsTable } from '../components/monitoring/TrackedObjectsTable';
import { RecentAlertsCard } from '../components/monitoring/RecentAlertsCard';
import { QuickActionsCard } from '../components/monitoring/QuickActionsCard';

interface MonitoringPageProps {
  telemetry: FrameTelemetry | null;
  status: SystemStatusResponse | null;
  chartHistory: TelemetryPoint[];
  alerts: AlertEvent[];
  isLive: boolean;
  isBackendOnline: boolean;
  isDemoMode: boolean;
  demoStatus: TrackingStatusType;
  onToggleDemo: () => void;
  onChangeDemoStatus: (st: TrackingStatusType) => void;
  onResetBaseline: () => void;
  onNavigateToAlerts?: () => void;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({
  telemetry,
  status,
  chartHistory,
  alerts,
  isLive,
  isBackendOnline,
  isDemoMode,
  demoStatus,
  onResetBaseline,
  onNavigateToAlerts,
}) => {
  const overallStatus = telemetry?.overall_status || status?.overall_status || (isDemoMode ? demoStatus : 'STABLE');
  const cameraConnected = status?.camera_connected ?? (isDemoMode ? true : false);
  const fps = telemetry?.fps || status?.current_fps || 18.6;

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Row 1: Live Camera (Left) + System Status & 4 Metric Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Live Camera Feed (~58%) */}
        <div className="lg:col-span-7 flex flex-col">
          <LiveCameraFeed
            telemetry={telemetry}
            cameraConnected={cameraConnected}
            isBackendConnected={isBackendOnline || isDemoMode}
            isDemoMode={isDemoMode}
            fps={fps}
            cameraSource={status?.camera_source}
            streamUrl={status?.stream_url}
          />
        </div>

        {/* Right Column: System Status + 2x2 Metric Cards (~42%) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <SystemStatusCard
            status={overallStatus}
            alertMessage={telemetry?.alert_message}
            thresholdPx={15.0}
            consecutiveFrames={10}
          />

          <div className="flex-1 flex flex-col justify-between">
            <MetricCards telemetry={telemetry} persistenceCount={overallStatus === 'MOVEMENT DETECTED' ? 10 : 2} />
          </div>
        </div>
      </div>

      {/* Row 2: Displacement Over Time (Left) + Tracked Objects Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col min-h-[310px]">
          <DisplacementChart data={chartHistory} threshold={15.0} />
        </div>

        <div className="flex flex-col min-h-[310px]">
          <TrackedObjectsTable tracks={telemetry?.active_tracks || []} />
        </div>
      </div>

      {/* Row 3: Recent Alerts (Left) + Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div>
          <RecentAlertsCard alerts={alerts} onViewAll={onNavigateToAlerts} />
        </div>

        <div>
          <QuickActionsCard onResetBaseline={onResetBaseline} />
        </div>
      </div>

      {/* Footer Legal & Clinical Disclaimer */}
      <div className="text-center pt-2 pb-4">
        <p className="text-xs text-slate-400 font-normal">
          IVGuard is an engineering early-warning system. Abnormal IV-line displacement detected — human assessment recommended.
        </p>
      </div>
    </div>
  );
};
