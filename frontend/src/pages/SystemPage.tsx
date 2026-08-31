import React from 'react';
import { SystemStatusResponse, FrameTelemetry } from '../types/ivguard';
import { ConnectionState } from '../services/websocket';
import { Server, Camera, Eye, Crosshair, Radio, Activity, CheckCircle2, XCircle } from 'lucide-react';

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
      title: 'Video Ingestion',
      sub: 'CameraService',
      details: status?.stream_url === '0' ? 'Local Laptop Webcam (Index 0)' : (status?.stream_url || 'Local Laptop Webcam (0)'),
      status: status?.camera_connected ? 'CONNECTED' : 'DISCONNECTED',
      isOk: Boolean(status?.camera_connected),
    },
    {
      title: 'Object Detection',
      sub: 'YOLO26n Nano Model',
      details: 'imgsz=480, conf=0.25, iou=0.50 (PIV + TUBE)',
      status: status?.model_loaded ? 'WEIGHTS LOADED' : 'UNLOADED',
      isOk: Boolean(status?.model_loaded),
    },
    {
      title: 'Temporal Tracking',
      sub: 'ByteTrack Multi-Object',
      details: 'Kalman Filter track association across frames',
      status: 'ACTIVE',
      isOk: true,
    },
    {
      title: 'Spatial Displacement',
      sub: 'DisplacementAnalyzer',
      details: 'Baseline reference (30f) + 5f Centroid smoothing',
      status: 'OPERATIONAL',
      isOk: true,
    },
    {
      title: 'Alert Decision Manager',
      sub: 'BackendAlertManager',
      details: 'Threshold: 15px @ 10 consecutive frames, 3.0s cooldown',
      status: 'MONITORING',
      isOk: true,
    },
    {
      title: 'Telemetry Stream',
      sub: 'FastAPI /ws/telemetry',
      details: 'Real-time WebSocket telemetry dispatcher',
      status: connectionState === 'CONNECTED' ? 'STREAMING' : 'DISCONNECTED',
      isOk: connectionState === 'CONNECTED',
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Health & Diagnostics</h2>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Real-time status of computer vision models, inference pipeline, and hardware stream ingestion.
        </p>
      </div>

      {/* Status Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] text-slate-400 font-medium block">Backend Gateway</span>
          <div className="flex items-center gap-1.5 mt-2">
            {isBackendConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-bold ${isBackendConnected ? 'text-emerald-700' : 'text-red-700'}`}>
              {isBackendConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] text-slate-400 font-medium block">Camera Link</span>
          <div className="flex items-center gap-1.5 mt-2">
            {status?.camera_connected ? (
              <Camera className="w-4 h-4 text-emerald-500" />
            ) : (
              <Camera className="w-4 h-4 text-slate-400" />
            )}
            <span className={`text-xs font-bold ${status?.camera_connected ? 'text-emerald-700' : 'text-slate-500'}`}>
              {status?.camera_connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] text-slate-400 font-medium block">AI Model</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">YOLO26n</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] text-slate-400 font-medium block">Tracker Engine</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Crosshair className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">ByteTrack</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] text-slate-400 font-medium block">Inference Speed</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 font-mono">
              {(telemetry?.fps || status?.current_fps || 18.6).toFixed(1)} FPS
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] text-slate-400 font-medium block">WebSocket</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Radio className={`w-4 h-4 ${connectionState === 'CONNECTED' ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className={`text-xs font-bold ${connectionState === 'CONNECTED' ? 'text-emerald-700' : 'text-red-700'}`}>
              {connectionState}
            </span>
          </div>
        </div>
      </div>

      {/* System Pipeline Architecture */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Pipeline Processing Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node, idx) => (
            <div key={idx} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{node.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  node.isOk ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {node.status}
                </span>
              </div>
              <div className="text-xs text-blue-600 font-semibold">{node.sub}</div>
              <p className="text-xs text-slate-500 truncate">{node.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
