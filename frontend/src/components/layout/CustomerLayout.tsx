import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Repeat, Receipt, CreditCard, LogOut, ShieldAlert } from 'lucide-react';

export const CustomerLayout: React.FC = () => {
  const { user, logout, isStaff } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Customer Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              S
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base">SUBSIGHT</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                Customer Portal
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            <NavLink
              to="/portal"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/portal/subscriptions"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              My Subscriptions
            </NavLink>
            <NavLink
              to="/portal/invoices"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
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
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              Return to Staff Operations
            </Link>
          )}

          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-xs text-slate-400">{user?.email}</div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 px-8 text-center text-xs text-slate-400">
        Brightloop Software, Inc. &copy; 2026 SUBSIGHT Subscription Intelligence Platform. All rights reserved.
      </footer>
    </div>
  );
};
