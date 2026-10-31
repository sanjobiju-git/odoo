import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, Sliders, FileText,
  Repeat, Receipt, CreditCard, Percent, Landmark,
  Activity, TrendingUp, UserCog, Sparkles
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
    { label: 'Payments & Ledger', path: '/app/payments', icon: CreditCard },
    { label: 'Taxes', path: '/app/taxes', icon: Landmark },
    { label: 'Discounts & Coupons', path: '/app/discounts', icon: Percent },
  ];

  const intelligenceItems = [
    { label: 'Subscription Health', path: '/app/intelligence', icon: Activity, badge: 'Radar' },
    { label: 'Revenue Simulator', path: '/app/simulator', icon: TrendingUp, badge: 'What-If' },
  ];

  return (
    <aside className="w-64 bg-[#292524] border-r border-[#403A35] flex flex-col flex-shrink-0 text-[#FAF7F5] select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-[#403A35]">
        <div className="w-8 h-8 rounded-md bg-[#211E1C] border border-[#403A35] flex items-center justify-center text-[#EAB308] font-bold text-sm tracking-wide">
          S
        </div>
        <div>
          <div className="font-semibold text-[#FAF7F5] tracking-tight text-sm flex items-center gap-2">
            SUBSIGHT
            <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-[#211E1C] text-[#EAB308] border border-[#403A35]">
              SaaS
            </span>
          </div>
          <div className="text-[11px] text-[#A8A29E] font-normal">Brightloop Software</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <div className="px-3 text-[10px] font-semibold tracking-wider text-[#78716C] uppercase mb-2">
            Operations
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#302B28] text-[#FAF7F5] font-semibold border-l-2 border-[#EAB308]'
                      : 'text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C]'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0 text-[#A8A29E]" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Intelligence Section */}
        <div>
          <div className="px-3 text-[10px] font-semibold tracking-wider text-[#78716C] uppercase mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#EAB308]" />
            <span>Intelligence Modules</span>
          </div>
          <nav className="space-y-0.5">
            {intelligenceItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#302B28] text-[#FAF7F5] font-semibold border-l-2 border-[#EAB308]'
                      : 'text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0 text-[#EAB308]" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#211E1C] text-[#EAB308] border border-[#403A35]">
                  {item.badge}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin Settings */}
        {isAdmin && (
          <div>
            <div className="px-3 text-[10px] font-semibold tracking-wider text-[#78716C] uppercase mb-2">
              Administration
            </div>
            <nav className="space-y-0.5">
              <NavLink
                to="/app/staff"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#302B28] text-[#FAF7F5] font-semibold border-l-2 border-[#EAB308]'
                      : 'text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C]'
                  }`
                }
              >
                <UserCog className="w-4 h-4 flex-shrink-0 text-[#A8A29E]" />
                <span>Staff Management</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* User Status Footer */}
      <div className="p-3 border-t border-[#403A35] bg-[#211E1C]">
        <div className="flex items-center gap-3 p-2 rounded-md bg-[#292524] border border-[#403A35]">
          <div className="w-7 h-7 rounded-md bg-[#302B28] border border-[#403A35] text-[#EAB308] flex items-center justify-center font-semibold text-xs">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#FAF7F5] truncate">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-[10px] text-[#A8A29E] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#65A882] inline-block"></span>
              {user?.role} Role
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
