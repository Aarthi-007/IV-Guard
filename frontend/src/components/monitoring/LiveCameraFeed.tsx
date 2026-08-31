import React, { useState } from 'react';
import { Camera, Maximize2, Cpu, Activity, RefreshCw, Radio } from 'lucide-react';
import { ApiService } from '../../services/api';
import { FrameTelemetry } from '../../types/ivguard';

interface LiveCameraFeedProps {
  telemetry: FrameTelemetry | null;
  cameraConnected: boolean;
  isBackendConnected: boolean;
  isDemoMode: boolean;
  fps: number;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  cameraConnected,
  isBackendConnected,
  isDemoMode,
  fps,
}) => {
  const [imgKey, setImgKey] = useState(0);
  const videoFeedUrl = ApiService.getVideoFeedUrl();

  const handleRefresh = () => {
    setImgKey((k) => k + 1);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-sm">•</span>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Live Camera Feed</h2>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <span>DEMO MODE</span>
            </div>
          ) : !isBackendConnected ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>BACKEND OFFLINE</span>
            </div>
          ) : cameraConnected ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>CAMERA DISCONNECTED</span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Reload Video Stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden min-h-[320px] flex items-center justify-center border border-slate-200">
        {isDemoMode ? (
          /* Simulated Demo Mode */
          <div className="relative w-full h-full min-h-[320px] bg-slate-900 flex items-center justify-center p-4">
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
              alt="Medical IV Arm Demo"
              className="w-full h-full object-cover rounded-lg opacity-85"
            />
            {/* Simulated Bounding Boxes */}
            <div className="absolute left-[38%] top-[30%] w-24 h-28 border-2 border-blue-500 rounded bg-blue-500/10 flex flex-col justify-between p-1">
              <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-1 py-0.5 rounded-sm self-start">
                PIV #1 0.96
              </span>
            </div>
            <div className="absolute left-[54%] top-[38%] w-28 h-24 border-2 border-emerald-500 rounded bg-emerald-500/10 flex flex-col justify-between p-1">
              <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-1 py-0.5 rounded-sm self-start">
                TUBE #2 0.94
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 self-center" />
            </div>
          </div>
        ) : isBackendConnected ? (
          /* Persistent MJPEG Video Feed from Backend */
          <img
            key={imgKey}
            src={`${videoFeedUrl}?k=${imgKey}`}
            alt="IVGuard Live Video Feed"
            className="w-full h-full object-contain max-h-[460px] rounded-lg"
          />
        ) : (
          /* Backend Offline State */
          <div className="bg-slate-900 w-full h-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 mb-3">
              <Radio className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-semibold text-red-200 tracking-tight">
              Backend Offline
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Unable to connect to FastAPI backend at <code className="text-slate-300 font-mono">http://localhost:8000</code>. Please start the backend service.
            </p>
          </div>
        )}
      </div>

      {/* Clean Bottom Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 truncate">Laptop Webcam (0)</span>
        </div>
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 truncate">640 × 480</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 truncate">YOLO26n + ByteTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 font-mono truncate">
            {fps > 0 ? `${fps.toFixed(1)} FPS` : '18.6 FPS'}
          </span>
        </div>
      </div>
    </div>
  );
};
