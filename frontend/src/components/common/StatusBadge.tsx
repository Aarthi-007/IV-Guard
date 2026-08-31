import React from 'react';
import { TrackingStatusType } from '../../types/ivguard';
import { CheckCircle2, AlertTriangle, RefreshCw, EyeOff, Radio } from 'lucide-react';

interface StatusBadgeProps {
  status: TrackingStatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showPulse = true }) => {
  let bg = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let pulseColor = 'bg-slate-400';
  let Icon = Radio;

  switch (status) {
    case 'STABLE':
      bg = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
      dotColor = 'bg-emerald-400';
      pulseColor = 'bg-emerald-500';
      Icon = CheckCircle2;
      break;
    case 'INITIALIZING':
      bg = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
      dotColor = 'bg-amber-400';
      pulseColor = 'bg-amber-500';
      Icon = RefreshCw;
      break;
    case 'MOVEMENT DETECTED':
      bg = 'bg-red-950/70 text-red-300 border-red-800 shadow-glow-red';
      dotColor = 'bg-red-500';
      pulseColor = 'bg-red-500';
      Icon = AlertTriangle;
      break;
    case 'LOST TRACK':
      bg = 'bg-slate-900 text-slate-400 border-slate-700';
      dotColor = 'bg-slate-500';
      pulseColor = 'bg-slate-500';
      Icon = EyeOff;
      break;
    case 'DISCONNECTED':
    default:
      bg = 'bg-red-950/30 text-rose-400 border-rose-900/50';
      dotColor = 'bg-rose-500';
      pulseColor = 'bg-rose-500';
      Icon = Radio;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-md border ${bg} ${sizeClasses} tracking-wider font-mono-numbers`}>
      <span className="relative flex h-2 w-2">
        {showPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span>{status}</span>
    </span>
  );
};
