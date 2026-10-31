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
    <header className="h-16 bg-[#292524] border-b border-[#403A35] px-6 md:px-8 flex items-center justify-between z-10 sticky top-0">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80 md:w-96">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions, customers, invoices..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* Portal Quick Switch for Staff/Admin */}
        {!isCustomer && (
          <Link
            to="/portal"
            className="hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#211E1C] text-[#EAB308] hover:bg-[#302B28] transition-colors border border-[#403A35]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Portal</span>
          </Link>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C] transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EAB308]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#292524] rounded-lg shadow-2xl border border-[#403A35] p-3.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#403A35]">
                <span className="font-semibold text-xs text-[#FAF7F5]">Notifications</span>
                <span className="text-[10px] font-medium text-[#EAB308] bg-[#211E1C] border border-[#403A35] px-2 py-0.5 rounded">
                  3 unread
                </span>
              </div>
              <div className="mt-2.5 space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-md bg-[#211E1C] border border-[#403A35] text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-[#FAF7F5]">
                      {n.type === 'critical' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#EAB308]" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#65A882]" />
                      )}
                      <span>{n.title}</span>
                      <span className="ml-auto text-[10px] text-[#78716C] font-normal">{n.time}</span>
                    </div>
                    <div className="text-[#A8A29E] text-[11px] mt-1">{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-[#403A35]"></div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-medium text-[#FAF7F5] leading-tight">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-[10px] text-[#A8A29E] flex items-center justify-end gap-1">
              <Shield className="w-3 h-3 text-[#EAB308]" />
              {user?.role}
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-md text-[#78716C] hover:text-[#D97770] hover:bg-[#211E1C] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
