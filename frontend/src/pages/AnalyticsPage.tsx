import React from 'react';
import { FrameTelemetry, SystemStatusResponse, TelemetryPoint } from '../types/ivguard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { Activity, Clock, Layers, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface AnalyticsPageProps {
  status: SystemStatusResponse | null;
  chartHistory: TelemetryPoint[];
  telemetry: FrameTelemetry | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  status,
  chartHistory,
  telemetry,
}) => {
  const maxPiv = chartHistory.reduce((max, p) => Math.max(max, p.pivDisplacement), 0);
  const maxTube = chartHistory.reduce((max, p) => Math.max(max, p.tubeDisplacement), 0);
  const maxDisplacement = Math.max(maxPiv, maxTube);

  const avgTubeDisp = chartHistory.length
    ? chartHistory.reduce((sum, p) => sum + p.tubeDisplacement, 0) / chartHistory.length
    : 0;

  const validRelDists = chartHistory
    .map((p) => p.relativeDistance)
    .filter((d): d is number => d !== null);

  const maxRelDist = validRelDists.length ? Math.max(...validRelDists) : 0;
  const avgRelDist = validRelDists.length
    ? validRelDists.reduce((sum, d) => sum + d, 0) / validRelDists.length
    : 0;

  const framesProcessed = status?.total_frames_processed ?? telemetry?.frame_number ?? chartHistory.length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono text-white tracking-tight">Engineering Analytics</h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Statistical aggregation of image-space spatial displacement and tracking performance.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-200 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Frames Processed</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{framesProcessed.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">YOLO26n + ByteTrack Ingestion</span>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Max Displacement</span>
            <ArrowUpRight className={`w-4 h-4 ${maxDisplacement >= 15 ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${maxDisplacement >= 15 ? 'text-red-400' : 'text-white'}`}>
            {maxDisplacement.toFixed(1)} <span className="text-xs font-normal text-slate-400">px</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Engineering Limit: 15.0 px</span>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Avg TUBE Δ</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {avgTubeDisp.toFixed(2)} <span className="text-xs font-normal text-slate-400">px</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Smoothed Centroid Baseline</span>
        </div>

        <div className="bg-surface-200 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Max PIV–TUBE Sep.</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {maxRelDist ? maxRelDist.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-400">px</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Avg: {avgRelDist ? avgRelDist.toFixed(1) : '—'} px
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Displacement History Chart */}
        <div className="bg-surface-200 border border-border rounded-xl p-5 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Displacement Trajectory (px)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Real-time sub-pixel Euclidean distance relative to calibrated baseline anchor.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-sky-400">● PIV</span>
              <span className="text-amber-400">● TUBE</span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1F293D" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="px" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111622', borderColor: '#1F293D', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="pivDisplacement"
                  name="PIV Δ"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="tubeDisplacement"
                  name="TUBE Δ"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spatial Separation Area Chart */}
        <div className="bg-surface-200 border border-border rounded-xl p-5 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                PIV–TUBE Spatial Separation (px)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Dynamic spatial Euclidean vector between catheter hub and tubing line.
              </p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="relDistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1F293D" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="px" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111622', borderColor: '#1F293D', borderRadius: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="relativeDistance"
                  name="PIV-TUBE Separation"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#relDistGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Session Summary Card */}
      <div className="bg-surface-200 border border-border rounded-xl p-5">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">
          Session Summary & Operational Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-surface-300 p-3 rounded-lg border border-border-subtle">
            <span className="text-slate-500 uppercase text-[10px] block">Model Weights</span>
            <span className="font-semibold text-slate-200">YOLO26n (480p)</span>
          </div>
          <div className="bg-surface-300 p-3 rounded-lg border border-border-subtle">
            <span className="text-slate-500 uppercase text-[10px] block">Tracker Engine</span>
            <span className="font-semibold text-slate-200">ByteTrack Kalman</span>
          </div>
          <div className="bg-surface-300 p-3 rounded-lg border border-border-subtle">
            <span className="text-slate-500 uppercase text-[10px] block">Temporal Smoothing</span>
            <span className="font-semibold text-slate-200">5-frame Window</span>
          </div>
          <div className="bg-surface-300 p-3 rounded-lg border border-border-subtle">
            <span className="text-slate-500 uppercase text-[10px] block">Baseline Calibration</span>
            <span className="font-semibold text-slate-200">30 Stable Frames</span>
          </div>
        </div>
      </div>
    </div>
  );
};
