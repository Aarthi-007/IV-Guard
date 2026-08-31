import React from 'react';
import { AlertEvent } from '../types/ivguard';
import { AlertTriangle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

interface AlertsPageProps {
  alerts: AlertEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, isLoading, onRefresh }) => {
  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Alerts & Event History</h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Log of abnormal physical displacement events detected above the 15.0 px spatial threshold.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Warning Notice Banner */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <span className="font-bold text-blue-900 text-sm block">
            Engineering Early Warning Protocol
          </span>
          <p className="leading-relaxed">
            Alerts represent spatial displacement exceeding 15.0 image-space pixels sustained for over 10 consecutive frames. The system operates strictly as an engineering early warning mechanism and does not perform clinical diagnostic evaluations.
          </p>
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Alert Event Log ({alerts.length || 1})
          </h3>
          <span className="text-xs text-slate-400">Cooldowned to 3.0s interval</span>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-150">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">System Initialized</span>
                    <span className="text-[11px] font-mono text-slate-400">15:42:31</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Monitoring session started. IV catheter and tubing are stable.</p>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Stable
              </span>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 gap-3"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    alert.severity === 'WARNING' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {alert.severity === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {alert.message.split('—')[0]}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(alert.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {alert.displacement_px !== null && (
                    <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      Δ {alert.displacement_px.toFixed(1)} px
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
