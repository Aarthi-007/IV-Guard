import React from 'react';
import { AlertEvent } from '../types/ivguard';
import { AlertTriangle, ShieldCheck, Clock, Layers, ArrowUpRight, RefreshCw } from 'lucide-react';

interface AlertsPageProps {
  alerts: AlertEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, isLoading, onRefresh }) => {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono text-white tracking-tight">Engineering Warnings & Alerts</h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Log of abnormal physical displacement events detected above the 15px spatial threshold.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-border text-slate-300 text-xs font-mono transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Primary Engineering Warning Notice */}
      <div className="bg-amber-950/20 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <span className="font-bold text-amber-300 uppercase tracking-wider font-mono">
            Engineering Warning Protocol
          </span>
          <p>
            Alerts represent spatial displacement exceeding 15.0 image-space pixels sustained for over 10 consecutive frames. The system operates strictly as an engineering early warning mechanism and does not perform clinical diagnostic evaluations.
          </p>
        </div>
      </div>

      {/* Alerts Table / Feed */}
      <div className="bg-surface-200 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Alert Event Log ({alerts.length})
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Cooldowned to 3.0s interval</span>
        </div>

        <div className="space-y-2.5">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
              <span className="text-slate-300 font-medium">No Movement Warnings Recorded</span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                The IV catheter and tubing setup have remained within calibrated tolerances.
              </span>
            </div>
          ) : (
            alerts.map((alert) => {
              const formattedTime = new Date(alert.timestamp * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={alert.alert_id}
                  className="bg-surface-300/80 border border-red-900/50 hover:border-red-700/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-red-950/80 text-red-400 border border-red-800 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-red-400 uppercase tracking-wider">
                          {alert.severity} • MOVEMENT WARNING
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">#{alert.alert_id}</span>
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5 font-sans font-medium">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono shrink-0 text-slate-300 self-end sm:self-center">
                    {alert.class_name && (
                      <span className="px-2 py-0.5 rounded bg-surface-100 border border-border-subtle text-[11px]">
                        {alert.class_name} {alert.track_id ? `#${alert.track_id}` : ''}
                      </span>
                    )}

                    {alert.displacement_px !== null && (
                      <span className="text-red-400 font-semibold text-[11px]">
                        Δ {alert.displacement_px.toFixed(1)} px
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
