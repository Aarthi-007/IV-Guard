import React from 'react';
import { SystemStatusResponse, FrameTelemetry } from '../types/ivguard';
import { ConnectionState } from '../services/websocket';
import { Cpu, Camera, Eye, Crosshair, Radio, Activity, CheckCircle2, XCircle, ArrowDown } from 'lucide-react';

interface SystemPageProps {
  status: SystemStatusResponse | null;
  telemetry: FrameTelemetry | null;
  connectionState: ConnectionState;
  isBackendConnected: boolean;
}

export const SystemPage: React.FC<SystemPageProps> = ({
  status,
  telemetry,
  connectionState,
  isBackendConnected,
}) => {
  const nodes = [
    {
      title: '1. VIDEO INGESTION',
      sub: 'CameraService',
      details: status?.stream_url || 'http://192.168.1.9:8080/video',
      status: status?.camera_connected ? 'OPERATIONAL' : 'DISCONNECTED',
      statusColor: status?.camera_connected ? 'text-emerald-400 border-emerald-800' : 'text-red-400 border-red-800',
    },
    {
      title: '2. OBJECT DETECTION',
      sub: 'YOLO26n Nano Model',
      details: 'imgsz=480, conf=0.25, iou=0.50 (PIV + TUBE)',
      status: status?.model_loaded ? 'WEIGHTS LOADED' : 'UNLOADED',
      statusColor: status?.model_loaded ? 'text-cyan-400 border-cyan-800' : 'text-slate-500 border-slate-800',
    },
    {
      title: '3. TEMPORAL TRACKING',
      sub: 'ByteTrack Multi-Object',
      details: 'Kalman Filter track association across frames',
      status: 'ACTIVE',
      statusColor: 'text-sky-400 border-sky-800',
    },
    {
      title: '4. SPATIAL DISPLACEMENT',
      sub: 'DisplacementAnalyzer',
      details: 'Baseline reference (30f) + 5f Centroid smoothing',
      status: telemetry?.overall_status || 'INITIALIZING',
      statusColor: 'text-emerald-400 border-emerald-800',
    },
    {
      title: '5. ALERT MANAGER',
      sub: 'BackendAlertManager',
      details: 'Threshold: 15px @ 10 consecutive frames, 3.0s cooldown',
      status: 'MONITORING',
      statusColor: 'text-amber-400 border-amber-800',
    },
    {
      title: '6. TELEMETRY & WEBSOCKET',
      sub: 'FastAPI /ws/telemetry',
      details: 'Broadcasts per-frame displacement telemetry',
      status: connectionState === 'CONNECTED' ? 'STREAMING' : 'DISCONNECTED',
      statusColor: connectionState === 'CONNECTED' ? 'text-emerald-400 border-emerald-800' : 'text-red-400 border-red-800',
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-mono text-white tracking-tight">System Health & Architecture</h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Real-time status of computer vision models, inference pipeline, and hardware stream ingestion.
        </p>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface-200 border border-border rounded-xl p-3.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Backend Server</span>
          <div className="flex items-center gap-1.5 mt-1">
            {isBackendConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-mono font-bold ${isBackendConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isBackendConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-3.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Camera Link</span>
          <div className="flex items-center gap-1.5 mt-1">
            {status?.camera_connected ? (
              <Camera className="w-4 h-4 text-emerald-400" />
            ) : (
              <Camera className="w-4 h-4 text-slate-500" />
            )}
            <span className={`text-xs font-mono font-bold ${status?.camera_connected ? 'text-emerald-400' : 'text-slate-500'}`}>
              {status?.camera_connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-3.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">AI Model</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              {status?.model_loaded ? 'YOLO26n' : 'NOT LOADED'}
            </span>
          </div>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-3.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Tracker Engine</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Crosshair className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-mono font-bold text-slate-200">ByteTrack</span>
          </div>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-3.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Inference Speed</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              {(telemetry?.fps || status?.current_fps || 0).toFixed(1)} FPS
            </span>
          </div>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-3.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">WebSocket</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Radio className={`w-4 h-4 ${connectionState === 'CONNECTED' ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className={`text-xs font-mono font-bold ${connectionState === 'CONNECTED' ? 'text-emerald-400' : 'text-red-400'}`}>
              {connectionState}
            </span>
          </div>
        </div>
      </div>

      {/* System Processing Pipeline Flow Architecture */}
      <div className="bg-surface-200 border border-border rounded-xl p-6">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider mb-5">
          System Processing Topology
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node, idx) => (
            <div key={idx} className="bg-surface-300 border border-border-subtle rounded-lg p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">{node.title}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${node.statusColor}`}>
                  {node.status}
                </span>
              </div>
              <div className="text-xs text-cyan-300 font-mono font-semibold">{node.sub}</div>
              <p className="text-[11px] text-slate-400 font-mono truncate">{node.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
