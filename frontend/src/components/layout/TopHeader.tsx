import React from 'react';
import { Camera, Eye, Crosshair, Radio, Activity, RefreshCw } from 'lucide-react';
import { TrackingStatusType } from '../../types/ivguard';
import { StatusBadge } from '../common/StatusBadge';

interface TopHeaderProps {
  currentPageTitle: string;
  cameraConnected: boolean;
  modelLoaded: boolean;
  fps: number;
  overallStatus: TrackingStatusType;
  isLive: boolean;
  isDemoMode: boolean;
  onResetBaseline?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPageTitle,
  cameraConnected,
  modelLoaded,
  fps,
  overallStatus,
  isLive,
  isDemoMode,
  onResetBaseline,
}) => {
  return (
    <header className="h-16 bg-surface-300 border-b border-border px-6 flex items-center justify-between shrink-0 select-none z-10">
      {/* Left Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-white tracking-tight font-mono">
          IVGuard <span className="text-slate-500 font-normal">/</span> {currentPageTitle}
        </h1>
        {isDemoMode && (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Simulated
          </span>
        )}
      </div>

      {/* Right Hardware & System Telemetry Status Strip */}
      <div className="flex items-center gap-4">
        {/* Camera Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-surface-200 border border-border-subtle text-xs">
          <Camera className={`w-3.5 h-3.5 ${cameraConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="text-slate-400 font-mono text-[11px]">Camera:</span>
          <span className={`font-mono font-medium text-[11px] ${cameraConnected ? 'text-emerald-300' : 'text-slate-400'}`}>
            {cameraConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Model */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-surface-200 border border-border-subtle text-xs">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-mono text-[11px]">Model:</span>
          <span className="font-mono text-[11px] font-medium text-slate-200">
            {modelLoaded ? 'YOLO26n' : 'UNLOADED'}
          </span>
        </div>

        {/* Tracker */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-surface-200 border border-border-subtle text-xs">
          <Crosshair className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 font-mono text-[11px]">Tracker:</span>
          <span className="font-mono text-[11px] font-medium text-slate-200">ByteTrack</span>
        </div>

        {/* FPS Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-surface-200 border border-border-subtle text-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 font-mono text-[11px]">FPS:</span>
          <span className="font-mono text-[11px] font-bold text-emerald-400">{fps.toFixed(1)}</span>
        </div>

        {/* Live Pulse */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-200 border border-border-subtle text-xs font-mono">
          <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className={`text-[10px] font-semibold ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* System Status Badge */}
        <StatusBadge status={overallStatus} size="md" />

        {/* Quick Reset Baseline Button */}
        {onResetBaseline && (
          <button
            onClick={onResetBaseline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-100 border border-border hover:border-cyan-500/50 hover:bg-surface-50 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-all"
            title="Reset spatial baseline position"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Reset Baseline</span>
          </button>
        )}
      </div>
    </header>
  );
};
