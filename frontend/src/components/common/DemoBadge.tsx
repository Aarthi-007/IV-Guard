import React from 'react';
import { Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import { TrackingStatusType } from '../../types/ivguard';

interface DemoBadgeProps {
  isDemoMode: boolean;
  demoStatus: TrackingStatusType;
  onToggleDemo: () => void;
  onChangeDemoStatus: (status: TrackingStatusType) => void;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  isDemoMode,
  demoStatus,
  onToggleDemo,
  onChangeDemoStatus,
}) => {
  return (
    <div className="flex items-center gap-3 bg-surface-200/90 border border-border-subtle rounded-lg px-3 py-1.5 text-xs">
      <button
        onClick={onToggleDemo}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
          isDemoMode
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-glow-amber'
            : 'bg-surface-100 text-slate-400 border border-border hover:text-slate-200'
        }`}
        title="Toggle simulated telemetry for offline presentations"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{isDemoMode ? 'DEMO MODE ACTIVE' : 'LIVE BACKEND'}</span>
        {isDemoMode ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
      </button>

      {isDemoMode && (
        <div className="flex items-center gap-1 pl-2 border-l border-border-subtle">
          <span className="text-[11px] text-slate-400">Simulate:</span>
          {(['STABLE', 'INITIALIZING', 'MOVEMENT DETECTED', 'LOST TRACK'] as TrackingStatusType[]).map((st) => (
            <button
              key={st}
              onClick={() => onChangeDemoStatus(st)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                demoStatus === st
                  ? 'bg-cyan-500 text-black font-semibold shadow-glow-cyan'
                  : 'bg-surface-100 text-slate-400 hover:text-slate-200 border border-border-subtle'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
