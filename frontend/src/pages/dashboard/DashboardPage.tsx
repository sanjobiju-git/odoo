import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DashboardMetrics } from '../../types';
import {
  TrendingUp, Users, DollarSign, AlertCircle, RefreshCw,
  Repeat, ArrowUpRight, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { Link } from 'react-router-dom';

// Warm Charcoal & Travertine Gold Chart Palette
const PIE_COLORS = ['#EAB308', '#65A882', '#A8A29E', '#78716C', '#D97770'];

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
    <div className="space-y-6 max-w-7xl mx-auto text-[#FAF7F5]">
      {/* Top Header & Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#403A35]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[#FAF7F5]">Financial Overview</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#211E1C] border border-[#403A35] text-[#A8A29E]">
              Real-time Ledger
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1">
            Reconciled recurring billing, recognized revenue, and active portfolio health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range switcher */}
          <div className="bg-[#211E1C] border border-[#403A35] rounded-md p-1 flex items-center text-xs font-medium">
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
                className={`px-3 py-1 rounded transition-colors ${
                  timeRange === btn.id
                    ? 'bg-[#EAB308] text-[#1C1917] font-semibold'
                    : 'text-[#A8A29E] hover:text-[#FAF7F5]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchMetrics(timeRange)}
            className="p-1.5 bg-[#211E1C] border border-[#403A35] rounded-md text-[#A8A29E] hover:text-[#EAB308] hover:border-[#EAB308] transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#EAB308]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-[#292524] border border-[#D97770]/40 text-[#D97770] text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="bg-[#292524] rounded-lg p-5 border border-[#403A35] transition-colors hover:border-[#78716C]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">Monthly Recurring (MRR)</span>
            <div className="p-1.5 rounded-md bg-[#211E1C] border border-[#403A35] text-[#EAB308]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#FAF7F5] tracking-tight">
            ${kpis ? Number(kpis.mrr).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2.5 flex items-center text-xs text-[#A8A29E] font-normal">
            <span className="text-[#EAB308] font-medium mr-1.5 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 inline" />
              ARR ${kpis ? Number(kpis.arr).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
            </span>
            <span>annualized run-rate</span>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-[#292524] rounded-lg p-5 border border-[#403A35] transition-colors hover:border-[#78716C]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">Cash Collected</span>
            <div className="p-1.5 rounded-md bg-[#211E1C] border border-[#403A35] text-[#65A882]">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#65A882] tracking-tight">
            ${kpis ? Number(kpis.revenue_collected).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2.5 flex items-center text-xs text-[#A8A29E]">
            <span className="text-[#FAF7F5] font-medium mr-1.5">
              ${kpis ? Number(kpis.revenue_billed).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
            </span>
            <span>invoiced in period</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-[#292524] rounded-lg p-5 border border-[#403A35] transition-colors hover:border-[#78716C]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">Active Contracts</span>
            <div className="p-1.5 rounded-md bg-[#211E1C] border border-[#403A35] text-[#FAF7F5]">
              <Repeat className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#FAF7F5] tracking-tight">
            {kpis?.active_subscriptions ?? 0}
          </div>
          <div className="mt-2.5 flex items-center text-xs text-[#A8A29E]">
            <span className="text-[#65A882] font-medium mr-1.5 flex items-center">
              <CheckCircle2 className="w-3 h-3 inline mr-1" />
              {kpis?.renewal_rate ?? 100}%
            </span>
            <span>renewal retention</span>
          </div>
        </div>

        {/* Overdue Balances */}
        <div className="bg-[#292524] rounded-lg p-5 border border-[#403A35] transition-colors hover:border-[#78716C]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">Overdue Receivables</span>
            <div className="p-1.5 rounded-md bg-[#211E1C] border border-[#403A35] text-[#D97770]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#D97770] tracking-tight">
            ${kpis ? Number(kpis.overdue_invoices_amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2.5 flex items-center text-xs text-[#A8A29E]">
            <span className="text-[#D97770] font-medium mr-1.5">
              {kpis?.overdue_invoices_count ?? 0} invoices
            </span>
            <span>pending collection</span>
          </div>
        </div>
      </div>

      {/* Strategic Intelligence Banner */}
      <div className="p-4 rounded-lg bg-[#292524] border border-[#403A35] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#211E1C] border border-[#403A35] text-[#EAB308]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-[#FAF7F5] tracking-wide">
              Brightloop Predictive & Strategic Intelligence
            </div>
            <div className="text-[11px] text-[#A8A29E] mt-0.5">
              5-signal Subscription Health Score radar and 12-month What-If Revenue financial simulations.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/intelligence"
            className="px-3 py-1.5 rounded-md bg-[#EAB308] hover:bg-[#CA8A04] text-xs font-semibold text-[#1C1917] transition-colors"
          >
            Health Radar
          </Link>
          <Link
            to="/app/simulator"
            className="px-3 py-1.5 rounded-md bg-[#211E1C] hover:bg-[#302B28] text-xs font-medium text-[#FAF7F5] border border-[#403A35] transition-colors"
          >
            Revenue Simulator
          </Link>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-[#292524] rounded-lg p-5 border border-[#403A35]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#FAF7F5] text-sm">Monthly Cash Inflow vs. Invoiced Billings</h3>
              <p className="text-[11px] text-[#A8A29E] mt-0.5">Trailing cash reconciliation comparing billed vs collected funds.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.revenue_trend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#78716C' }} stroke="#403A35" />
                <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickFormatter={(val) => `$${val}`} stroke="#403A35" />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#211E1C', borderColor: '#403A35', borderRadius: '6px', color: '#FAF7F5', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#A8A29E' }} />
                <Bar dataKey="billed" name="Billed Amount" fill="#78716C" radius={[2, 2, 0, 0]} />
                <Bar dataKey="collected" name="Cash Collected" fill="#65A882" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Status Breakdown */}
        <div className="bg-[#292524] rounded-lg p-5 border border-[#403A35]">
          <h3 className="font-semibold text-[#FAF7F5] text-sm mb-1">Contract Lifecycle Distribution</h3>
          <p className="text-[11px] text-[#A8A29E] mb-3">Portfolio status across active, paused, confirmed, and closed.</p>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.subscription_status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(charts?.subscription_status_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#292524" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#211E1C', borderColor: '#403A35', borderRadius: '6px', color: '#FAF7F5', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Revenue by Product & Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#292524] rounded-lg p-5 border border-[#403A35]">
          <h3 className="font-semibold text-[#FAF7F5] text-sm mb-1">Recognized Revenue by Product Tier</h3>
          <p className="text-[11px] text-[#A8A29E] mb-4">Total settled invoice volume categorized by core product line.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts?.revenue_by_product || []} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10, fill: '#78716C' }} stroke="#403A35" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fill: '#A8A29E' }} stroke="#403A35" />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#211E1C', borderColor: '#403A35', borderRadius: '6px', color: '#FAF7F5', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#EAB308" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#292524] rounded-lg p-5 border border-[#403A35]">
          <h3 className="font-semibold text-[#FAF7F5] text-sm mb-1">Recurring Run-Rate by Billing Frequency</h3>
          <p className="text-[11px] text-[#A8A29E] mb-4">Contract cadence breakdown across Monthly, Yearly, and Weekly.</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.revenue_by_plan || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716C' }} stroke="#403A35" />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10, fill: '#78716C' }} stroke="#403A35" />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Monthly Run-rate']}
                  contentStyle={{ backgroundColor: '#211E1C', borderColor: '#403A35', borderRadius: '6px', color: '#FAF7F5', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#A8A29E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
