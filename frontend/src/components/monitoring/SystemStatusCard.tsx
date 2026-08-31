import React from 'react';
import { TrackingStatusType } from '../../types/ivguard';
import { Check, AlertTriangle, RefreshCw, EyeOff, Radio } from 'lucide-react';

interface SystemStatusCardProps {
  status: TrackingStatusType;
  alertMessage?: string | null;
  thresholdPx?: number;
  consecutiveFrames?: number;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  status,
  alertMessage,
  thresholdPx = 15.0,
  consecutiveFrames = 10,
}) => {
  let title = 'STABLE';
  let desc = 'IV setup is within the calibrated spatial range.';
  let iconBg = 'bg-emerald-500 text-white';
  let statusColor = 'text-emerald-600';
  let Icon = Check;

  switch (status) {
    case 'STABLE':
      title = 'STABLE';
      desc = 'IV setup is within the calibrated spatial range.';
      iconBg = 'bg-emerald-500 text-white shadow-sm';
      statusColor = 'text-emerald-600';
      Icon = Check;
      break;
    case 'INITIALIZING':
      title = 'INITIALIZING';
      desc = 'Establishing baseline position...';
      iconBg = 'bg-amber-500 text-white shadow-sm';
      statusColor = 'text-amber-600';
      Icon = RefreshCw;
      break;
    case 'MOVEMENT DETECTED':
      title = 'MOVEMENT DETECTED';
      desc = alertMessage || 'Abnormal IV-line displacement detected — human assessment recommended.';
      iconBg = 'bg-red-500 text-white shadow-sm animate-pulse';
      statusColor = 'text-red-600';
      Icon = AlertTriangle;
      break;
    case 'LOST TRACK':
      title = 'LOST TRACK';
      desc = 'Object tracking temporarily unavailable.';
      iconBg = 'bg-slate-400 text-white';
      statusColor = 'text-slate-600';
      Icon = EyeOff;
      break;
    case 'DISCONNECTED':
    default:
      title = 'BACKEND OFFLINE';
      desc = 'Unable to connect to the IVGuard backend.';
      iconBg = 'bg-red-500 text-white';
      statusColor = 'text-red-600';
      Icon = Radio;
      break;
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-400 font-mono text-sm">•</span>
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">System Status</h2>
      </div>

      <div className="flex items-center justify-between">
        {/* Left Status Block */}
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${statusColor}`}>{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        </div>

        {/* Right Threshold Meta */}
        <div className="text-right space-y-2 border-l border-slate-100 pl-6 shrink-0">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Threshold</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{thresholdPx.toFixed(1)} px</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Consecutive Frames</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{consecutiveFrames}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
