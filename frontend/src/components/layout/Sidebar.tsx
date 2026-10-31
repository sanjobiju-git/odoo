import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, Sliders, FileText,
  Repeat, Receipt, CreditCard, Percent, Landmark,
  Activity, TrendingUp, UserCog, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/app/customers', icon: Users },
    { label: 'Products & Variants', path: '/app/products', icon: Package },
    { label: 'Subscription Plans', path: '/app/plans', icon: Sliders },
    { label: 'Quotations', path: '/app/quotations', icon: FileText },
    { label: 'Subscriptions', path: '/app/subscriptions', icon: Repeat },
    { label: 'Invoices & Billing', path: '/app/invoices', icon: Receipt },
    { label: 'Payments & Reconciliation', path: '/app/payments', icon: CreditCard },
    { label: 'Taxes', path: '/app/taxes', icon: Landmark },
    { label: 'Discounts & Coupons', path: '/app/discounts', icon: Percent },
  ];

  const intelligenceItems = [
    { label: 'Subscription Health', path: '/app/intelligence', icon: Activity, badge: 'AI' },
    { label: 'Revenue Simulator', path: '/app/simulator', icon: TrendingUp, badge: 'What-If' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          S
        </div>
        <div>
          <div className="font-bold text-white tracking-tight text-base flex items-center gap-1.5">
            SUBSIGHT
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              SaaS
            </span>
          </div>
          <div className="text-[11px] text-slate-400 -mt-0.5 font-medium">Brightloop Software</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Operations
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Intelligence Section */}
        <div>
          <div className="px-3 text-[11px] font-semibold tracking-wider text-indigo-400 uppercase mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligence Modules</span>
          </div>
          <nav className="space-y-1">
            {intelligenceItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin Settings */}
        {isAdmin && (
          <div>
            <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Administration
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/app/staff"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <UserCog className="w-4 h-4 flex-shrink-0" />
                <span>Staff Management</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* User Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              {user?.role} Role
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
