import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export const CustomerLayout: React.FC = () => {
  const { user, logout, isStaff } = useAuth();

  return (
    <div className="min-h-screen bg-[#1C1917] text-[#FAF7F5] flex flex-col font-sans">
      {/* Customer Header */}
      <header className="h-16 bg-[#292524] border-b border-[#403A35] px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#211E1C] border border-[#403A35] flex items-center justify-center text-[#EAB308] font-bold text-sm">
              S
            </div>
            <div>
              <span className="font-semibold text-[#FAF7F5] tracking-tight text-sm">SUBSIGHT</span>
              <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#211E1C] text-[#EAB308] border border-[#403A35]">
                Customer Portal
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            <NavLink
              to="/portal"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#302B28] text-[#FAF7F5] font-semibold border-b-2 border-[#EAB308]'
                    : 'text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C]'
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/portal/subscriptions"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#302B28] text-[#FAF7F5] font-semibold border-b-2 border-[#EAB308]'
                    : 'text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C]'
                }`
              }
            >
              My Subscriptions
            </NavLink>
            <NavLink
              to="/portal/invoices"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#302B28] text-[#FAF7F5] font-semibold border-b-2 border-[#EAB308]'
                    : 'text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C]'
                }`
              }
            >
              Invoices & Billing
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isStaff && (
            <Link
              to="/app/dashboard"
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-[#211E1C] text-[#EAB308] hover:bg-[#302B28] border border-[#403A35] transition-colors"
            >
              Return to Staff Operations
            </Link>
          )}

          <div className="text-right">
            <div className="text-xs font-medium text-[#FAF7F5] leading-tight">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-[10px] text-[#A8A29E]">{user?.email}</div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-md text-[#78716C] hover:text-[#D97770] hover:bg-[#211E1C] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#403A35] py-6 px-8 text-center text-xs text-[#78716C]">
        Brightloop Software, Inc. &copy; 2026 SUBSIGHT Subscription Intelligence Platform.
      </footer>
    </div>
  );
};
