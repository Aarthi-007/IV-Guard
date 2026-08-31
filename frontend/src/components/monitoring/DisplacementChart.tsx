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

interface DisplacementChartProps {
  data: TelemetryPoint[];
  threshold?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-lg text-xs">
        <div className="text-slate-400 font-mono mb-1 border-b border-slate-100 pb-1">
          {label} (Frame #{payload[0]?.payload?.frame})
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold font-mono">{entry.value?.toFixed(2)} px</span>
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
  // Default mock dataset for clean initial render matching reference image
  const defaultData: TelemetryPoint[] = [
    { time: '00:00', frame: 1, pivDisplacement: 4.1, tubeDisplacement: 2.2, relativeDistance: 118, threshold },
    { time: '00:10', frame: 100, pivDisplacement: 6.8, tubeDisplacement: 4.5, relativeDistance: 118, threshold },
    { time: '00:20', frame: 200, pivDisplacement: 5.2, tubeDisplacement: 3.1, relativeDistance: 118, threshold },
    { time: '00:30', frame: 300, pivDisplacement: 7.9, tubeDisplacement: 5.4, relativeDistance: 119, threshold },
    { time: '00:40', frame: 400, pivDisplacement: 6.1, tubeDisplacement: 4.2, relativeDistance: 118, threshold },
    { time: '00:50', frame: 500, pivDisplacement: 8.5, tubeDisplacement: 6.3, relativeDistance: 120, threshold },
    { time: '01:00', frame: 600, pivDisplacement: 6.4, tubeDisplacement: 4.8, relativeDistance: 118, threshold },
  ];

  const chartData = data.length > 3 ? data : defaultData;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex flex-col h-full">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Displacement Over Time</h2>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
            <span>PIV Displacement</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
            <span>TUBE Displacement</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-500">
            <span className="w-3 h-0.5 bg-red-500 border-b border-red-500 border-dashed" />
            <span>Threshold ({threshold.toFixed(1)} px)</span>
          </div>
        </div>
      </div>

      {/* Recharts LineChart */}
      <div className="w-full flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              domain={[0, 30]}
              ticks={[0, 10, 20, 30]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              unit=""
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={threshold}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="pivDisplacement"
              name="PIV Displacement"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="tubeDisplacement"
              name="TUBE Displacement"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
