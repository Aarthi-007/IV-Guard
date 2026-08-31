import React, { useState } from 'react';
import { Camera, Maximize2, Cpu, Activity, RefreshCw, Settings, Video, Check } from 'lucide-react';
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
  const [showConfig, setShowConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState('http://192.168.1.9:8080/video');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const videoFeedUrl = ApiService.getVideoFeedUrl();

  const handleRefresh = () => {
    setImgKey((k) => k + 1);
  };

  const handleQuickSetSource = async (url: string) => {
    setIsUpdating(true);
    setUpdateMsg(null);
    try {
      await ApiService.updateConfig({ stream_url: url });
      setInputUrl(url);
      setUpdateMsg(`Camera source updated to ${url}`);
      setTimeout(() => {
        handleRefresh();
        setUpdateMsg(null);
        setShowConfig(false);
      }, 1200);
    } catch (err: any) {
      setUpdateMsg(err?.message || 'Failed to update camera URL');
    } finally {
      setIsUpdating(false);
    }
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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE</span>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Configure Camera Source (Local Webcam or Phone IP)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRefresh}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Reload Video Stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Camera Source Overlay Popup */}
      {showConfig && (
        <div className="mb-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs transition-all animate-in fade-in">
          <div className="flex items-center justify-between font-semibold text-slate-800">
            <span>Quick Camera Stream Selection</span>
            <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600 text-xs font-mono">✕</button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickSetSource('0')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 font-medium text-slate-700 transition-all shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-blue-600" />
              <span>PC / Laptop Webcam (0)</span>
            </button>

            <button
              onClick={() => handleQuickSetSource('http://192.168.1.9:8080/video')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 font-medium text-slate-700 transition-all shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>IP Webcam (Default)</span>
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g. http://192.168.1.X:8080/video"
              className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono outline-none focus:border-blue-500 text-slate-800"
            />
            <button
              onClick={() => handleQuickSetSource(inputUrl)}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
            >
              Apply
            </button>
          </div>

          {updateMsg && (
            <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> {updateMsg}
            </p>
          )}
        </div>
      )}

      {/* Main Video Viewport */}
      <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center border border-slate-200">
        {!isDemoMode ? (
          <img
            key={imgKey}
            src={`${videoFeedUrl}?k=${imgKey}`}
            alt="IVGuard Live MJPEG Stream"
            className="w-full h-full object-contain max-h-[460px] rounded-lg"
          />
        ) : (
          /* Simulated Demo Feed */
          <div className="relative w-full h-full min-h-[340px] bg-slate-900 flex items-center justify-center p-4">
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
        )}
      </div>

      {/* Clean Bottom Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 truncate">IP Webcam</span>
        </div>
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 truncate">640 × 640</span>
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
