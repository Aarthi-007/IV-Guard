import React, { useState } from 'react';
import { Camera, Maximize2, RefreshCw, Radio, Eye, Crosshair } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoFeedUrl = ApiService.getVideoFeedUrl();

  const handleRefreshFeed = () => {
    setImgKey((k) => k + 1);
  };

  const handleToggleFullscreen = () => {
    const el = document.getElementById('camera-viewport-container');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      id="camera-viewport-container"
      className="bg-surface-200 border border-border rounded-xl flex flex-col overflow-hidden shadow-lg h-full"
    >
      {/* Viewport Header */}
      <div className="px-4 py-3 bg-surface-300 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Live Camera Stream
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-100 text-slate-400 border border-border-subtle">
            YOLO26n + ByteTrack Overlays
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLive ? 'bg-emerald-400' : 'bg-red-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isLive ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
            </span>
            <span className={isLive ? 'text-emerald-400 font-medium' : 'text-slate-500 font-medium'}>
              {isLive ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>

          <button
            onClick={handleRefreshFeed}
            className="p-1 rounded hover:bg-surface-100 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reload Video Feed Stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-1 rounded hover:bg-surface-100 text-slate-400 hover:text-slate-200 transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Screen */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] sm:min-h-[420px] overflow-hidden group">
        {!isDemoMode ? (
          <img
            key={imgKey}
            src={`${videoFeedUrl}?k=${imgKey}`}
            alt="IVGuard Live MJPEG Stream"
            className="w-full h-full object-contain max-h-[620px]"
            onError={(e) => {
              // Fallback placeholder if backend offline
              (e.target as HTMLElement).style.display = 'none';
            }}
            onLoad={(e) => {
              (e.target as HTMLElement).style.display = 'block';
            }}
          />
        ) : (
          /* Simulated Demo Mode Video Viewport */
          <div className="relative w-full h-full min-h-[420px] bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Synthetic PIV Bounding Box */}
            {telemetry?.active_tracks.map((track) => {
              const isPiv = track.class_name === 'PIV';
              const color = isPiv ? 'border-sky-400 text-sky-400' : 'border-amber-500 text-amber-400';
              return (
                <div
                  key={track.track_id}
                  className={`absolute border-2 ${color} bg-cyan-500/5 transition-all duration-75 flex flex-col justify-between`}
                  style={{
                    left: `${(track.center[0] / 640) * 100}%`,
                    top: `${(track.center[1] / 480) * 100}%`,
                    width: '90px',
                    height: '80px',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="text-[9px] font-mono font-bold bg-black/80 px-1 py-0.5 border-b border-current">
                    {track.class_name} #{track.track_id} ({track.confidence.toFixed(2)})
                  </div>
                  <div className="text-[9px] font-mono bg-black/80 px-1 py-0.5 text-right">
                    Δ {track.displacement_px.toFixed(1)}px
                  </div>
                </div>
              );
            })}

            {/* Demo Watermark */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm border border-amber-500/50 rounded px-2.5 py-1 text-amber-400 font-mono text-xs flex items-center gap-2">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>DEMO MODE — SYNTHETIC SPATIAL SIMULATION</span>
            </div>
          </div>
        )}

        {/* Top-Right HUD Tag */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-border-subtle rounded-md px-2.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-3 select-none">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>480p</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-border-subtle pl-2">
            <Crosshair className="w-3 h-3 text-sky-400" />
            <span>{fps.toFixed(1)} FPS</span>
          </div>
          {telemetry?.frame_number && (
            <div className="border-l border-border-subtle pl-2 text-slate-400">
              #{telemetry.frame_number}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2.5 bg-surface-300 border-t border-border/80 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-medium">LIVE</span>
          <span>•</span>
          <span className="text-cyan-400">YOLO26n</span>
          <span>•</span>
          <span className="text-sky-400">ByteTrack</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>MJPEG Zero-Latency Stream</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-500">640×480 @ 30Hz</span>
        </div>
      </div>
    </div>
  );
};
