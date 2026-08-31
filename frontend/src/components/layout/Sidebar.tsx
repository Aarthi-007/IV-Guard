import React from 'react';
import { Camera, Activity, AlertTriangle, Cpu, Settings, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

export type PageId = 'monitoring' | 'analytics' | 'alerts' | 'system' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isBackendConnected: boolean;
  activeAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isBackendConnected,
  activeAlertCount,
}) => {
  const navItems = [
    { id: 'monitoring' as PageId, label: 'Monitoring', icon: Camera, badge: 'LIVE' },
    { id: 'analytics' as PageId, label: 'Analytics', icon: Activity },
    {
      id: 'alerts' as PageId,
      label: 'Alerts',
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? String(activeAlertCount) : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    { id: 'system' as PageId, label: 'System', icon: Cpu },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface-300 border-r border-border flex flex-col justify-between shrink-0 select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-border/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-glow-cyan">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-mono">IVGuard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                v0.1
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-tight">IV-Line Safety Monitor</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      item.badgeColor || 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend Connectivity Status Footer */}
      <div className="p-4 border-t border-border/80 bg-surface-400/50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Backend Gateway</span>
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-medium ${
              isBackendConnected ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isBackendConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                CONNECTED
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500" />
                OFFLINE
              </>
            )}
          </span>
        </div>

        <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>FastAPI / YOLO26n</span>
          <span className="text-slate-400">ByteTrack</span>
        </div>
      </div>
    </aside>
  );
};
