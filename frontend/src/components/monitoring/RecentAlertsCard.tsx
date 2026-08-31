import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { AlertEvent } from '../../types/ivguard';

interface RecentAlertsCardProps {
  alerts: AlertEvent[];
  onViewAll?: () => void;
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({
  alerts,
  onViewAll,
}) => {
  const latestAlert = alerts[0];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Recent Alerts</h2>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View All Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Alert Entry */}
      <div className="flex items-center gap-3.5 py-2">
        {latestAlert && latestAlert.severity === 'WARNING' ? (
          <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        ) : (
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-slate-400">
              {latestAlert
                ? new Date(latestAlert.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : '15:42:31'}
            </span>
            <span className="text-xs font-bold text-slate-900 truncate">
              {latestAlert ? latestAlert.message.split('—')[0] : 'System Initialized'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {latestAlert ? 'Abnormal displacement detected — human assessment recommended.' : 'Monitoring session started'}
          </p>
        </div>
      </div>
    </div>
  );
};
