import React from 'react';
import { Camera, Activity, Bell, Monitor, Settings, ShieldCheck } from 'lucide-react';

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
      icon: Bell,
      badge: activeAlertCount > 0 ? String(activeAlertCount) : undefined,
      badgeColor: 'bg-red-100 text-red-700',
    },
    { id: 'system' as PageId, label: 'System', icon: Monitor },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none z-20 shadow-sm">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-slate-900">IVGuard</span>
            <p className="text-xs text-slate-500 font-medium">IV-Line Safety Monitor</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeColor || 'bg-blue-100 text-blue-700'
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

      {/* Backend Status Box at Bottom */}
      <div className="p-4">
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                isBackendConnected ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {isBackendConnected ? 'Backend Connected' : 'Backend Offline'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>FastAPI • YOLO26n • ByteTrack</span>
          </div>
          <div className="text-[10px] text-slate-400">v1.0.0</div>
        </div>
      </div>
    </aside>
  );
};
