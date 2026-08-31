import React, { useState } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';

interface QuickActionsCardProps {
  onStartMonitoring?: () => void;
  onStopMonitoring?: () => void;
  onResetBaseline?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onStartMonitoring,
  onStopMonitoring,
  onResetBaseline,
}) => {
  const [isMonitoring, setIsMonitoring] = useState(true);

  const handleStart = () => {
    setIsMonitoring(true);
    onStartMonitoring?.();
  };

  const handleStop = () => {
    setIsMonitoring(false);
    onStopMonitoring?.();
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-400 font-mono text-sm">•</span>
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Quick Actions</h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleStart}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
            isMonitoring
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Monitoring</span>
        </button>

        <button
          onClick={handleStop}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
            !isMonitoring
              ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Stop Monitoring</span>
        </button>

        <button
          onClick={onResetBaseline}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Baseline</span>
        </button>
      </div>
    </div>
  );
};
