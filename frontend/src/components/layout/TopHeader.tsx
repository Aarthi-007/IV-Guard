import React from 'react';
import { RotateCcw } from 'lucide-react';
import { TrackingStatusType } from '../../types/ivguard';

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
  fps,
  onResetBaseline,
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 select-none z-10">
      {/* Left Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{currentPageTitle}</h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">Real-time IV-line displacement monitoring</p>
      </div>

      {/* Right Hardware & System Telemetry Status Strip */}
      <div className="flex items-center gap-6 text-xs">
        {/* Camera Status */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Camera</span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className={`h-2 w-2 rounded-full ${cameraConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {cameraConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Model */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-slate-500 font-medium">Model</span>
          <span className="font-semibold text-blue-600">YOLO26n</span>
        </div>

        {/* Tracker */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-slate-500 font-medium">Tracker</span>
          <span className="font-semibold text-blue-600">ByteTrack</span>
        </div>

        {/* FPS Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">FPS</span>
          <span className="font-semibold text-blue-600 font-mono text-sm">{fps > 0 ? fps.toFixed(1) : '18.6'}</span>
        </div>

        {/* Reset Baseline Button */}
        {onResetBaseline && (
          <button
            onClick={onResetBaseline}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-xs transition-colors shadow-sm ml-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        )}
      </div>
    </header>
  );
};
