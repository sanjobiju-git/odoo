import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SimulationResult } from '../../types';
import {
  TrendingUp, Sliders, ArrowUpRight, ArrowDownRight,
  Save, Download, Sparkles, Check, RefreshCw, BarChart3, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, Legend, LineChart, Line, BarChart, Bar
} from 'recharts';

export const SimulatorPage: React.FC = () => {
  const [params, setParams] = useState({
    growth_rate_pct: 8.0,
    churn_rate_pct: 3.0,
    price_change_pct: 5.0,
    discount_change_pct: 0.0,
    new_customers_monthly: 15,
  });

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [presets, setPresets] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scenarioTitle, setScenarioTitle] = useState('Q1 Growth & Price Hike Scenario');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation(params);
      setSimulation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const data = await api.comparePresets();
      setPresets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    runSimulation();
    fetchPresets();
  }, []);

  const handleSliderChange = (field: string, value: number) => {
    const updated = { ...params, [field]: value };
    setParams(updated);
  };

  const handleSaveScenario = async () => {
    setSaving(true);
    try {
      await api.runSimulation({
        ...params,
        save_scenario: true,
        title: scenarioTitle,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchPresets();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isPositiveGrowth = Number(simulation?.percentage_change ?? 0) >= 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              What-If Revenue Simulator
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Parametric Forecasting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model the financial impact of customer growth, churn, price adjustments, and discounts over 12 months.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={scenarioTitle}
              onChange={(e) => setScenarioTitle(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-xs"
              placeholder="Scenario Title"
            />
            <button
              onClick={handleSaveScenario}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save Scenario'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parametric Sliders Control Center */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Simulation Input Vectors</span>
            </div>
            <button
              onClick={runSimulation}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Run Model
            </button>
          </div>

          <div className="space-y-5 text-xs">
            {/* Customer Growth % */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Monthly Growth Rate</span>
                <span className="text-indigo-600 font-mono font-bold">+{params.growth_rate_pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={params.growth_rate_pct}
                onChange={(e) => handleSliderChange('growth_rate_pct', parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0% (Flat)</span>
                <span>30% (Hyper-growth)</span>
              </div>
            </div>

            {/* Churn Rate % */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Monthly Churn Rate</span>
                <span className="text-rose-600 font-mono font-bold">{params.churn_rate_pct}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={params.churn_rate_pct}
                onChange={(e) => handleSliderChange('churn_rate_pct', parseFloat(e.target.value))}
                className="w-full accent-rose-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0.5% (Elite)</span>
                <span>15% (High Churn)</span>
              </div>
            </div>

            {/* Price Change % */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Catalog Price Adjustment</span>
                <span className={`font-mono font-bold ${params.price_change_pct >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {params.price_change_pct > 0 ? `+${params.price_change_pct}%` : `${params.price_change_pct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="40"
                step="1"
                value={params.price_change_pct}
                onChange={(e) => handleSliderChange('price_change_pct', parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>-20% (Cut)</span>
                <span>+40% (Expansion)</span>
              </div>
            </div>

            {/* Discount Change % */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Average Discount Factor</span>
                <span className="text-slate-900 font-mono font-bold">{params.discount_change_pct}%</span>
              </div>
              <input
                type="range"
                min="-15"
                max="25"
                step="1"
                value={params.discount_change_pct}
                onChange={(e) => handleSliderChange('discount_change_pct', parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>-15% (Tighter)</span>
                <span>+25% (Heavy Promos)</span>
              </div>
            </div>

            {/* New Customers Added Monthly */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>New Customers Added / Month</span>
                <span className="text-slate-900 font-mono font-bold">+{params.new_customers_monthly}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={params.new_customers_monthly}
                onChange={(e) => handleSliderChange('new_customers_monthly', parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0 accounts</span>
                <span>50 accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): 12-Month Projections Graph & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Projected Impact Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Database Baseline MRR</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                ${simulation ? Number(simulation.baseline_mrr).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Live subscription anchor</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Projected 12mo MRR</span>
              <div className="text-xl font-extrabold text-indigo-600 mt-1">
                ${simulation ? Number(simulation.projected_mrr).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div className="text-[11px] text-indigo-500 font-medium mt-0.5">
                ARR ${simulation ? Number(simulation.projected_arr).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '0'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Projected Growth Delta</span>
              <div className={`text-xl font-extrabold mt-1 flex items-center gap-1 ${isPositiveGrowth ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositiveGrowth ? <ArrowUpRight className="w-5 h-5 inline" /> : <ArrowDownRight className="w-5 h-5 inline" />}
                {simulation?.percentage_change}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Net Delta: ${simulation ? Number(simulation.revenue_difference).toLocaleString() : '0.00'}
              </div>
            </div>
          </div>

          {/* 12-Month Projected MRR Area Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">12-Month Projected MRR Trajectory</h3>
                <p className="text-xs text-slate-500">Monthly forecast applying compounding growth and subscriber attrition.</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation?.projections || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Projected MRR']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="projected_mrr" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorMRR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Scenario Comparative Presets Matrix */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Strategic Scenario Comparison Matrix</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Baseline */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">Baseline</span>
            <div className="mt-3 text-lg font-extrabold text-slate-900">
              ${presets?.scenarios?.baseline ? Number(presets.scenarios.baseline.projected_mrr).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Growth: 0% | Churn: 3%</div>
            <div className="text-[11px] font-semibold text-slate-600 mt-2">
              Status Quo Projection
            </div>
          </div>

          {/* Optimistic */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Optimistic</span>
            <div className="mt-3 text-lg font-extrabold text-emerald-700">
              ${presets?.scenarios?.optimistic ? Number(presets.scenarios.optimistic.projected_mrr).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '--'}
            </div>
            <div className="text-xs text-emerald-600 mt-1">Growth: +15% | Churn: 1.5%</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-2">
              +{presets?.scenarios?.optimistic?.percentage_change}% Growth Delta
            </div>
          </div>

          {/* Expected */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Expected</span>
            <div className="mt-3 text-lg font-extrabold text-indigo-700">
              ${presets?.scenarios?.expected ? Number(presets.scenarios.expected.projected_mrr).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '--'}
            </div>
            <div className="text-xs text-indigo-600 mt-1">Growth: +8% | Churn: 3.5%</div>
            <div className="text-[11px] font-semibold text-indigo-700 mt-2">
              +{presets?.scenarios?.expected?.percentage_change}% Growth Delta
            </div>
          </div>

          {/* Pessimistic */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Pessimistic</span>
            <div className="mt-3 text-lg font-extrabold text-rose-700">
              ${presets?.scenarios?.pessimistic ? Number(presets.scenarios.pessimistic.projected_mrr).toLocaleString('en-US', { minimumFractionDigits: 0 }) : '--'}
            </div>
            <div className="text-xs text-rose-600 mt-1">Growth: +1% | Churn: 8%</div>
            <div className="text-[11px] font-semibold text-rose-700 mt-2">
              {presets?.scenarios?.pessimistic?.percentage_change}% Downside Risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
