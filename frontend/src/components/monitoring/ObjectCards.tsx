import React from 'react';
import { FrameTelemetry } from '../../types/ivguard';
import { Shield, Disc, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';

interface ObjectCardsProps {
  telemetry: FrameTelemetry | null;
}

export const ObjectCards: React.FC<ObjectCardsProps> = ({ telemetry }) => {
  const pivTrack = telemetry?.active_tracks.find((t) => t.class_name === 'PIV');
  const tubeTrack = telemetry?.active_tracks.find((t) => t.class_name === 'TUBE');

  const maxDisplacement = Math.max(
    pivTrack?.displacement_px || 0,
    tubeTrack?.displacement_px || 0
  );

  const relativeDistance = tubeTrack?.relative_to_piv_px ?? null;

  return (
    <div className="space-y-3">
      {/* Cards Grid: PIV Anchor & IV Tube */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* PIV Anchor Card */}
        <div className="bg-surface-200 border border-border rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">PIV Anchor</h3>
                <p className="text-[10px] text-slate-400">Catheter Insertion Base</p>
              </div>
            </div>

            {pivTrack ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                DETECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                <XCircle className="w-3 h-3 text-slate-500" />
                UNSEEN
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-border-subtle">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Track ID</span>
              <span className="font-semibold text-slate-200">{pivTrack ? `#${pivTrack.track_id}` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Confidence</span>
              <span className="font-semibold text-cyan-400">
                {pivTrack ? `${(pivTrack.confidence * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Centroid (X, Y)</span>
              <span className="text-slate-300 text-[11px]">
                {pivTrack ? `(${pivTrack.center[0]}, ${pivTrack.center[1]})` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Displacement</span>
              <span className={`font-semibold ${
                (pivTrack?.displacement_px || 0) > 15 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {pivTrack ? `${pivTrack.displacement_px.toFixed(1)} px` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* IV Tube Card */}
        <div className="bg-surface-200 border border-border rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Disc className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">IV Tubing</h3>
                <p className="text-[10px] text-slate-400">Extension Line Section</p>
              </div>
            </div>

            {tubeTrack ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                DETECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                <XCircle className="w-3 h-3 text-slate-500" />
                UNSEEN
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-border-subtle">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Track ID</span>
              <span className="font-semibold text-slate-200">{tubeTrack ? `#${tubeTrack.track_id}` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Confidence</span>
              <span className="font-semibold text-amber-400">
                {tubeTrack ? `${(tubeTrack.confidence * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Centroid (X, Y)</span>
              <span className="text-slate-300 text-[11px]">
                {tubeTrack ? `(${tubeTrack.center[0]}, ${tubeTrack.center[1]})` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Displacement</span>
              <span className={`font-semibold ${
                (tubeTrack?.displacement_px || 0) > 15 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {tubeTrack ? `${tubeTrack.displacement_px.toFixed(1)} px` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Metrics Strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-200 border border-border rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Max Spatial Displacement
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-2xl font-bold font-mono ${
                maxDisplacement >= 15.0 ? 'text-red-400' : 'text-slate-100'
              }`}>
                {maxDisplacement.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">px</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono text-slate-500 block uppercase">Threshold</span>
            <span className="text-xs font-mono font-semibold text-amber-400">15.0 px</span>
          </div>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              PIV–TUBE Separation
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {relativeDistance !== null ? relativeDistance.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-400 font-mono">px</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono text-slate-500 block uppercase">Spatial Mode</span>
            <span className="text-xs font-mono text-slate-300">Euclidean</span>
          </div>
        </div>
      </div>
    </div>
  );
};
