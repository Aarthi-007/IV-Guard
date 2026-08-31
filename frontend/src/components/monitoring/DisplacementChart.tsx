import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TelemetryPoint } from '../../types/ivguard';
import { Activity } from 'lucide-react';

interface DisplacementChartProps {
  data: TelemetryPoint[];
  threshold?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-300 border border-border p-2.5 rounded-lg shadow-xl text-xs font-mono">
        <div className="text-slate-400 mb-1 border-b border-border-subtle pb-1">
          Time: {label} (Frame #{payload[0]?.payload?.frame})
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value?.toFixed(2)} px</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DisplacementChart: React.FC<DisplacementChartProps> = ({
  data,
  threshold = 15.0,
}) => {
  return (
    <div className="bg-surface-200 border border-border rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Displacement History
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-300">PIV Δ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">TUBE Δ</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-3 h-0.5 bg-red-500 border-b border-red-500 border-dashed" />
            <span>Threshold ({threshold}px)</span>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 min-h-[220px]">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
            <Activity className="w-6 h-6 mb-2 opacity-50 animate-pulse" />
            <span>Awaiting telemetry stream to populate displacement curve...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1F293D" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#1F293D' }}
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.max(25, Math.ceil(dataMax + 5))]}
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#1F293D' }}
                unit="px"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={threshold}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `WARNING THRESHOLD (${threshold}px)`,
                  fill: '#EF4444',
                  fontSize: 9,
                  position: 'insideTopRight',
                  fontFamily: 'monospace',
                }}
              />
              <Line
                type="monotone"
                dataKey="pivDisplacement"
                name="PIV Displacement"
                stroke="#38BDF8"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="tubeDisplacement"
                name="TUBE Displacement"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-border-subtle pt-2">
        <span>Image-Space Metric: Sub-pixel Euclidean offset</span>
        <span>Window: Last {data.length} frames</span>
      </div>
    </div>
  );
};
