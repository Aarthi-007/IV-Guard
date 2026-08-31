import React from 'react';
import { FrameTelemetry, SystemStatusResponse, TelemetryPoint, TrackingStatusType } from '../types/ivguard';
import { SystemStatusHero } from '../components/monitoring/SystemStatusHero';
import { LiveCameraFeed } from '../components/monitoring/LiveCameraFeed';
import { ObjectCards } from '../components/monitoring/ObjectCards';
import { SpatialRelation } from '../components/monitoring/SpatialRelation';
import { DisplacementChart } from '../components/monitoring/DisplacementChart';
import { ActiveTracksTable } from '../components/monitoring/ActiveTracksTable';
import { PipelineStrip } from '../components/common/PipelineStrip';
import { DemoBadge } from '../components/common/DemoBadge';

interface MonitoringPageProps {
  telemetry: FrameTelemetry | null;
  status: SystemStatusResponse | null;
  chartHistory: TelemetryPoint[];
  isLive: boolean;
  isDemoMode: boolean;
  demoStatus: TrackingStatusType;
  onToggleDemo: () => void;
  onChangeDemoStatus: (st: TrackingStatusType) => void;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({
  telemetry,
  status,
  chartHistory,
  isLive,
  isDemoMode,
  demoStatus,
  onToggleDemo,
  onChangeDemoStatus,
}) => {
  const overallStatus = telemetry?.overall_status || status?.overall_status || 'DISCONNECTED';
  const cameraConnected = status?.camera_connected ?? false;
  const modelLoaded = status?.model_loaded ?? false;
  const fps = telemetry?.fps || status?.current_fps || 0;

  const pivTrack = telemetry?.active_tracks.find((t) => t.class_name === 'PIV');
  const tubeTrack = telemetry?.active_tracks.find((t) => t.class_name === 'TUBE');

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1720px] mx-auto">
      {/* Top Banner Controls & Demo Mode bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <PipelineStrip
          status={overallStatus}
          cameraConnected={cameraConnected}
          modelLoaded={modelLoaded}
          fps={fps}
        />
        <DemoBadge
          isDemoMode={isDemoMode}
          demoStatus={demoStatus}
          onToggleDemo={onToggleDemo}
          onChangeDemoStatus={onChangeDemoStatus}
        />
      </div>

      {/* Flagship System Status Hero */}
      <SystemStatusHero status={overallStatus} alertMessage={telemetry?.alert_message} />

      {/* Main 2-Column Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Live Camera Feed */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col h-full space-y-5">
          <LiveCameraFeed
            telemetry={telemetry}
            cameraConnected={cameraConnected}
            isLive={isLive}
            isDemoMode={isDemoMode}
            fps={fps}
          />

          {/* Active Tracks Table directly under Camera */}
          <ActiveTracksTable tracks={telemetry?.active_tracks || []} />
        </div>

        {/* Right Column: Live Analysis Panel, Spatial Relations & Real-time Graph */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col space-y-5">
          {/* Live Object Detection Cards */}
          <ObjectCards telemetry={telemetry} />

          {/* PIV-TUBE Relative Spatial Linkage */}
          <SpatialRelation
            relativeDistance={tubeTrack?.relative_to_piv_px ?? null}
            pivDetected={Boolean(pivTrack)}
            tubeDetected={Boolean(tubeTrack)}
          />

          {/* Live Displacement History Chart */}
          <div className="h-[310px]">
            <DisplacementChart data={chartHistory} threshold={15.0} />
          </div>
        </div>
      </div>
    </div>
  );
};
