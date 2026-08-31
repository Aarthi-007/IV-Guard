import React from 'react';
import { Camera, Eye, Crosshair, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { TrackingStatusType } from '../../types/ivguard';

interface PipelineStripProps {
  status: TrackingStatusType;
  cameraConnected: boolean;
  modelLoaded: boolean;
  fps: number;
}

export const PipelineStrip: React.FC<PipelineStripProps> = ({
  status,
  cameraConnected,
  modelLoaded,
  fps,
}) => {
  const isOnline = status !== 'DISCONNECTED' && cameraConnected;

  const steps = [
    {
      id: 'cam',
      name: 'CAMERA STREAM',
      desc: cameraConnected ? 'MJPEG (IP Webcam)' : 'DISCONNECTED',
      icon: Camera,
      active: cameraConnected,
      color: cameraConnected ? 'text-emerald-400 border-emerald-800 bg-emerald-950/20' : 'text-slate-500 border-slate-800 bg-slate-900/50',
    },
    {
      id: 'yolo',
      name: 'YOLO26n DETECT',
      desc: modelLoaded ? `480p • ${fps.toFixed(1)} FPS` : 'OFFLINE',
      icon: Eye,
      active: modelLoaded && isOnline,
      color: modelLoaded && isOnline ? 'text-cyan-400 border-cyan-800 bg-cyan-950/20' : 'text-slate-500 border-slate-800 bg-slate-900/50',
    },
    {
      id: 'track',
      name: 'BYTETRACK',
      desc: isOnline ? 'Multi-Object Association' : 'INACTIVE',
      icon: Crosshair,
      active: isOnline,
      color: isOnline ? 'text-sky-400 border-sky-800 bg-sky-950/20' : 'text-slate-500 border-slate-800 bg-slate-900/50',
    },
    {
      id: 'disp',
      name: 'SPATIAL ANALYSIS',
      desc: status === 'INITIALIZING' ? 'Calibrating Baseline...' : 'Euclidean Δpx Filtering',
      icon: Activity,
      active: isOnline,
      color: status === 'MOVEMENT DETECTED'
        ? 'text-red-400 border-red-800 bg-red-950/30'
        : status === 'INITIALIZING'
        ? 'text-amber-400 border-amber-800 bg-amber-950/20'
        : isOnline
        ? 'text-emerald-400 border-emerald-800 bg-emerald-950/20'
        : 'text-slate-500 border-slate-800 bg-slate-900/50',
    },
    {
      id: 'alert',
      name: 'ALERT DECISION',
      desc: status === 'MOVEMENT DETECTED' ? 'WARNING ACTIVE' : 'NOMINAL (3s Cooldown)',
      icon: AlertTriangle,
      active: status === 'MOVEMENT DETECTED',
      color: status === 'MOVEMENT DETECTED'
        ? 'text-red-400 border-red-700 bg-red-900/40 shadow-glow-red font-semibold'
        : 'text-slate-500 border-slate-800 bg-slate-900/40',
    },
  ];

  return (
    <div className="w-full bg-surface-200/90 border border-border-subtle rounded-lg px-4 py-2.5 flex items-center justify-between overflow-x-auto gap-2">
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 shrink-0 mr-2 border-r border-border-subtle pr-3">
        <span className="h-2 w-2 rounded-full bg-cyan-400" />
        Processing Pipeline
      </div>

      <div className="flex items-center gap-2 flex-1 justify-between min-w-[720px]">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded border ${step.color} transition-all duration-200 flex-1`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold tracking-wider font-mono truncate">{step.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{step.desc}</div>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
