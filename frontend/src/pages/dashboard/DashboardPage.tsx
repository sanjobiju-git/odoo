import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DashboardMetrics } from '../../types';
import {
  TrendingUp, Users, DollarSign, AlertCircle, RefreshCw,
  Repeat, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async (range: string) => {
    setLoading(true);
    try {
      const data = await api.getDashboardMetrics(range);
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(timeRange);
  }, [timeRange]);

  const kpis = metrics?.kpis;
  const charts = metrics?.charts;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Financial Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time MRR, recurring billing health, and cash reconciliation from database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range switcher */}
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center shadow-sm text-xs font-medium">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'this_year', label: 'YTD' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id)}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeRange === btn.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchMetrics(timeRange)}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Recurring Revenue</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ${kpis ? Number(kpis.mrr).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 font-medium">
            <span className="text-indigo-600 font-semibold mr-1.5 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 inline" />
              ARR ${kpis ? Number(kpis.arr).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
            </span>
            <span>annualized run-rate</span>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cash Collected</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            ${kpis ? Number(kpis.revenue_collected).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 font-medium">
            <span className="text-slate-700 font-semibold mr-1.5">
              ${kpis ? Number(kpis.revenue_billed).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
            </span>
            <span>gross billed in period</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Subscriptions</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {kpis?.active_subscriptions ?? 0}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 font-medium">
            <span className="text-emerald-600 font-semibold mr-1.5 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-0.5" />
              {kpis?.renewal_rate ?? 100}%
            </span>
            <span>renewal retention rate</span>
          </div>
        </div>

        {/* Overdue Balances */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue Receivables</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
            ${kpis ? Number(kpis.overdue_invoices_amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 font-medium">
            <span className="text-amber-700 font-semibold mr-1.5">
              {kpis?.overdue_invoices_count ?? 0} invoices
            </span>
            <span>requiring payment follow-up</span>
          </div>
        </div>
      </div>

      {/* Quick Action Intelligence Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/50 border border-indigo-400/30 text-indigo-200">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="font-semibold text-sm">Brightloop Strategic Intelligence Engines</div>
            <div className="text-xs text-slate-300">
              Run real-time predictive churn health scores or test growth and pricing decisions with the What-If Simulator.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/app/intelligence"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
          >
            Health Score Radar
          </Link>
          <Link
            to="/app/simulator"
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors border border-slate-700"
          >
            What-If Simulator
          </Link>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Cash Collected vs. Billed Invoices</h3>
              <p className="text-xs text-slate-500">6-month trend comparing invoiced revenue against settled cash inflow.</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.revenue_trend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="billed" name="Billed Amount" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Cash Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Status Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">Subscription Status Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Active, paused, confirmed, and closed subscriptions.</p>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.subscription_status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(charts?.subscription_status_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Revenue by Product & Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">Recognized Revenue by Product Catalog</h3>
          <p className="text-xs text-slate-500 mb-4">Settled invoice totals per product tier.</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts?.revenue_by_product || []} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">Monthly Recurring Volume by Plan Cadence</h3>
          <p className="text-xs text-slate-500 mb-4">Active subscription contract revenue contribution.</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.revenue_by_plan || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Run-rate Volume']} />
                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
