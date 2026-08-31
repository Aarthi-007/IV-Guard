import React from 'react';
import { Shield, Disc } from 'lucide-react';

interface SpatialRelationProps {
  relativeDistance: number | null;
  pivDetected: boolean;
  tubeDetected: boolean;
}

export const SpatialRelation: React.FC<SpatialRelationProps> = ({
  relativeDistance,
  pivDetected,
  tubeDetected,
}) => {
  const isLinked = pivDetected && tubeDetected && relativeDistance !== null;

  return (
    <div className="bg-surface-200 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          PIV–TUBE Relative Distance
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Spatial Separation Model
        </span>
      </div>

      {/* Visual Vector Linkage Representation */}
      <div className="py-4 px-3 bg-surface-300 rounded-lg border border-border-subtle flex items-center justify-between relative overflow-hidden">
        {/* Background grid accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d10_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* PIV Anchor Node */}
        <div className="flex items-center gap-2 relative z-10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
            pivDetected
              ? 'bg-sky-500/20 text-sky-400 border-sky-400 shadow-glow-cyan'
              : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}>
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold block text-slate-200">PIV Anchor</span>
            <span className="text-[9px] font-mono text-slate-400">{pivDetected ? 'CALIBRATED' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Connecting Vector Line & Metric Badge */}
        <div className="flex-1 mx-4 flex flex-col items-center relative z-10">
          <div className="text-center mb-1">
            <span className="font-mono text-xs font-bold text-cyan-300">
              {isLinked ? `${relativeDistance.toFixed(1)} px` : '—'}
            </span>
          </div>
          <div className="w-full relative flex items-center">
            <div className={`w-full h-0.5 transition-all ${
              isLinked
                ? 'bg-gradient-to-r from-sky-400 via-cyan-400 to-amber-400 shadow-glow-cyan'
                : 'bg-slate-700 border-dashed'
            }`} />
            {isLinked && (
              <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
            )}
          </div>
        </div>

        {/* TUBE Node */}
        <div className="flex items-center gap-2 relative z-10 text-right">
          <div>
            <span className="text-[11px] font-mono font-semibold block text-slate-200">IV Tubing</span>
            <span className="text-[9px] font-mono text-slate-400">{tubeDetected ? 'TRACKING' : 'OFFLINE'}</span>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
            tubeDetected
              ? 'bg-amber-500/20 text-amber-400 border-amber-400'
              : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}>
            <Disc className="w-4 h-4" />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">
        Euclidean distance between catheter anchor centroid and tracked tubing vector.
      </p>
    </div>
  );
};
