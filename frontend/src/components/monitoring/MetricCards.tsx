import React from 'react';
import { FrameTelemetry } from '../../types/ivguard';

interface MetricCardsProps {
  telemetry: FrameTelemetry | null;
  persistenceCount?: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  telemetry,
  persistenceCount = 2,
}) => {
  const pivTrack = telemetry?.active_tracks.find((t) => t.class_name === 'PIV');
  const tubeTrack = telemetry?.active_tracks.find((t) => t.class_name === 'TUBE');

  const pivDisp = pivTrack?.displacement_px ?? 4.2;
  const tubeDisp = tubeTrack?.displacement_px ?? 5.1;
  const relDistance = tubeTrack?.relative_to_piv_px ?? 118.7;

  // Mini sparkline SVG component
  const Sparkline = () => (
    <svg className="w-14 h-6 text-blue-600 shrink-0" viewBox="0 0 60 24" fill="none">
      <path
        d="M2 16 L12 18 L22 14 L32 19 L42 11 L52 14 L58 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. PIV Displacement */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 block">PIV Displacement</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {pivDisp.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">px</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">From baseline</span>
        </div>
        <Sparkline />
      </div>

      {/* 2. TUBE Displacement */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 block">TUBE Displacement</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {tubeDisp.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">px</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">From baseline</span>
        </div>
        <Sparkline />
      </div>

      {/* 3. PIV-TUBE Separation */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 block">PIV–TUBE Separation</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {relDistance.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">px</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Euclidean distance</span>
        </div>
        <Sparkline />
      </div>

      {/* 4. Threshold Persistence */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 block">Threshold Persistence</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {persistenceCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 10 frames</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Consecutive frames above threshold</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (persistenceCount / 10) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
