import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingChanges: Record<string, any>;
}

export const ThresholdModal: React.FC<ThresholdModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pendingChanges,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-300 border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-white">
              Confirm Engineering Threshold Change
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Changing detection thresholds can affect movement-warning sensitivity. These are engineering parameters for physical displacement tracking and do not represent clinical diagnostic criteria.
        </p>

        <div className="bg-surface-200 border border-border-subtle rounded-lg p-3 text-xs font-mono space-y-1.5 text-slate-300">
          <span className="text-[10px] text-slate-500 uppercase block mb-1">Pending Parameter Updates:</span>
          {Object.entries(pendingChanges).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-400">{k}:</span>
              <span className="font-semibold text-cyan-300">{String(v)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-100 hover:bg-surface-50 text-slate-300 text-xs font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs font-mono transition-all shadow-glow-cyan"
          >
            Apply Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
