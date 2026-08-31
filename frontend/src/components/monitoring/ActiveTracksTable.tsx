import React from 'react';
import { TrackedObjectPayload } from '../../types/ivguard';
import { Crosshair } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ActiveTracksTableProps {
  tracks: TrackedObjectPayload[];
}

export const ActiveTracksTable: React.FC<ActiveTracksTableProps> = ({ tracks }) => {
  return (
    <div className="bg-surface-200 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Active Tracked Objects
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-100 text-slate-300 border border-border-subtle">
          Count: {tracks.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-border text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="py-2 px-3">Class</th>
              <th className="py-2 px-3">Track ID</th>
              <th className="py-2 px-3">Confidence</th>
              <th className="py-2 px-3">Centroid (X, Y)</th>
              <th className="py-2 px-3">Displacement</th>
              <th className="py-2 px-3">Rel. to PIV</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {tracks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-500 font-mono text-xs">
                  No active tracked objects detected in current camera view.
                </td>
              </tr>
            ) : (
              tracks.map((t) => {
                const isPiv = t.class_name === 'PIV';
                return (
                  <tr key={t.track_id} className="hover:bg-surface-100/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPiv
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {t.class_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">#{t.track_id}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-medium">
                      {(t.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      ({t.center[0]}, {t.center[1]})
                    </td>
                    <td className={`py-2.5 px-3 font-semibold ${
                      t.displacement_px >= 15.0 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {t.displacement_px.toFixed(1)} px
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {t.relative_to_piv_px !== null ? `${t.relative_to_piv_px.toFixed(1)} px` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={t.status} size="sm" showPulse={false} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
