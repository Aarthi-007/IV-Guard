import React, { useState } from 'react';
import { Camera, Maximize2, Cpu, Activity, RefreshCw } from 'lucide-react';
import { ApiService } from '../../services/api';
import { FrameTelemetry } from '../../types/ivguard';

interface LiveCameraFeedProps {
  telemetry: FrameTelemetry | null;
  cameraConnected: boolean;
  isLive: boolean;
  isDemoMode: boolean;
  fps: number;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  telemetry,
  cameraConnected,
  isLive,
  isDemoMode,
  fps,
}) => {
  const [imgKey, setImgKey] = useState(0);
  const [hasError, setHasError] = useState(false);

  const videoFeedUrl = ApiService.getVideoFeedUrl();

  const handleRefresh = () => {
    setHasError(false);
    setImgKey((k) => k + 1);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-sm">•</span>
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Live Camera Feed</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE</span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors ml-1"
            title="Reload Video Stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden min-h-[340px] flex items-center justify-center border border-slate-200">
        {!isDemoMode && !hasError ? (
          <img
            key={imgKey}
            src={`${videoFeedUrl}?k=${imgKey}`}
            alt="Live Camera Feed"
            className="w-full h-full object-contain max-h-[500px]"
            onError={() => setHasError(true)}
          />
        ) : isDemoMode ? (
          /* Simulated Demo Feed */
          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center p-6">
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
        ) : (
          /* Empty / Disconnected State */
          <div className="text-center p-8 text-slate-400 space-y-2">
            <Camera className="w-8 h-8 text-slate-500 mx-auto opacity-70 mb-2" />
            <p className="text-sm font-medium text-slate-300">Camera stream unavailable</p>
            <p className="text-xs text-slate-500">Waiting for backend connection at {videoFeedUrl}...</p>
          </div>
        )}
      </div>

      {/* Clean Bottom Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">IP Webcam</span>
        </div>
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">640 × 640</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">YOLO26n + ByteTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700 font-mono">
            {fps > 0 ? `${fps.toFixed(1)} FPS` : '18.6 FPS'}
          </span>
        </div>
      </div>
    </div>
  );
};
