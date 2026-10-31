import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, ExternalLink, LogOut, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, isCustomer } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Health Score Alert', desc: 'Starlight Digital Media dropped to At Risk (Score 42).', type: 'critical', time: '10m ago' },
    { id: 2, title: 'Renewal Pending', desc: 'Apex Cloud Systems subscription renews in 15 days.', type: 'info', time: '1h ago' },
    { id: 3, title: 'Invoice Paid', desc: 'Invoice INV-94827 settled ($149.00 USD).', type: 'success', time: '3h ago' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 sticky top-0 shadow-sm">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions, customers, invoices..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Portal Quick Switch for Staff/Admin */}
        {!isCustomer && (
          <Link
            to="/portal"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Portal View</span>
          </Link>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800">Intelligence Notifications</span>
                <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  3 unread
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {n.type === 'critical' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>{n.title}</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <div className="text-slate-600 mt-1">{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-xs text-slate-400 font-medium flex items-center justify-end gap-1">
              <Shield className="w-3 h-3 text-indigo-500" />
              {user?.role}
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
