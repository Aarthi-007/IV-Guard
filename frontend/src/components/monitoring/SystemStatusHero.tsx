import React from 'react';
import { TrackingStatusType } from '../../types/ivguard';
import { ShieldCheck, AlertOctagon, RefreshCw, EyeOff, Radio } from 'lucide-react';

interface SystemStatusHeroProps {
  status: TrackingStatusType;
  alertMessage?: string | null;
}

export const SystemStatusHero: React.FC<SystemStatusHeroProps> = ({ status, alertMessage }) => {
  let bg = 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400';
  let title = 'STABLE';
  let desc = 'IV setup is within the calibrated spatial range. No abnormal physical movement detected.';
  let Icon = ShieldCheck;
  let pulse = false;

  switch (status) {
    case 'STABLE':
      bg = 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400';
      title = 'SYSTEM STABLE';
      desc = 'IV setup is within the calibrated spatial range.';
      Icon = ShieldCheck;
      break;
    case 'INITIALIZING':
      bg = 'bg-amber-950/40 border-amber-800/80 text-amber-400';
      title = 'INITIALIZING & CALIBRATING';
      desc = 'Establishing baseline reference position (30 stable frames)...';
      Icon = RefreshCw;
      break;
    case 'MOVEMENT DETECTED':
      bg = 'bg-red-950/60 border-red-700 text-red-400 shadow-glow-red';
      title = 'MOVEMENT DETECTED';
      desc = alertMessage || 'Abnormal IV-line displacement detected — human assessment recommended.';
      Icon = AlertOctagon;
      pulse = true;
      break;
    case 'LOST TRACK':
      bg = 'bg-slate-900 border-slate-700 text-slate-400';
      title = 'LOST TRACK';
      desc = 'Object tracking temporarily unavailable. Re-identifying catheter and tubing...';
      Icon = EyeOff;
      break;
    case 'DISCONNECTED':
    default:
      bg = 'bg-rose-950/40 border-rose-900 text-rose-400';
      title = 'BACKEND OFFLINE';
      desc = 'Unable to receive telemetry from IVGuard backend server.';
      Icon = Radio;
      break;
  }

  return (
    <div
      className={`w-full rounded-xl border p-4 sm:p-5 flex items-center justify-between transition-all duration-300 ${bg} ${
        pulse ? 'animate-pulse-subtle ring-1 ring-red-500/40' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-black/40 border border-current/30 shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest opacity-75">System Status</span>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight font-mono">{title}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 font-sans">{desc}</p>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-end text-right text-xs font-mono opacity-80 shrink-0">
        <span className="uppercase text-[10px] tracking-wider text-slate-400">Standard Safety Metric</span>
        <span className="font-semibold text-slate-200 mt-0.5">Threshold: 15.0 px (10 frames)</span>
      </div>
    </div>
  );
};
