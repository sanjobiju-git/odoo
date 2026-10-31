import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CustomerHealthScore } from '../../types';
import {
  Activity, AlertTriangle, ShieldCheck, RefreshCw,
  TrendingUp, TrendingDown, Minus, CheckCircle2, ChevronRight,
  Info, Sparkles, Filter, X
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const HealthScorePage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [scores, setScores] = useState<CustomerHealthScore[]>([]);
  const [selectedScore, setSelectedScore] = useState<CustomerHealthScore | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dash, list] = await Promise.all([
        api.getHealthDashboard(),
        api.getHealthScores(categoryFilter === 'ALL' ? undefined : categoryFilter),
      ]);
      setDashboardData(dash);
      setScores(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      await api.recalculateHealthScores();
      await fetchData();
    } finally {
      setRecalculating(false);
    }
  };

  const handleDismissRec = async (recId: string) => {
    try {
      await api.dismissRecommendation(recId);
      await fetchData();
      if (selectedScore) {
        setSelectedScore({
          ...selectedScore,
          recommendations: selectedScore.recommendations?.filter((r) => r.id !== recId),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Subscription Health Score Radar
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Intelligence Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Explainable 0–100 weighted retention scoring with dynamic missing-telemetry normalization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculateAll}
            disabled={recalculating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Recalculate All Scores'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Account Health</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {dashboardData?.average_health_score ?? 0}
            <span className="text-sm font-semibold text-slate-400"> / 100</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all monitored subscriptions</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Healthy (80–100)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            {dashboardData?.healthy_count ?? 0}
          </div>
          <div className="text-xs text-emerald-600/80 mt-1 font-medium">Low churn probability</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Needs Attention (50–79)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Info className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-500 tracking-tight">
            {dashboardData?.attention_count ?? 0}
          </div>
          <div className="text-xs text-amber-600/80 mt-1 font-medium">Proactive engagement advised</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">At Risk (0–49)</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
            {dashboardData?.at_risk_count ?? 0}
          </div>
          <div className="text-xs text-rose-600/80 mt-1 font-medium">Immediate intervention required</div>
        </div>
      </div>

      {/* Explanatory Missing-Data Policy Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-start gap-3 shadow-sm">
        <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-white">Missing Data & Telemetry Policy:</span> When usage or engagement data is unconfigured for a customer, SUBSIGHT dynamically renormalizes weights across all available signals (e.g. payment reliability, renewal tenure, support interactions) rather than penalizing missing telemetry as zero. Coverage percentage is explicitly transparent.
        </div>
      </div>

      {/* Customer Health Radar Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Filter Category:</span>
            <div className="flex items-center gap-1.5 ml-2">
              {['ALL', 'HEALTHY', 'NEEDS_ATTENTION', 'AT_RISK'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{scores.length}</strong> evaluated accounts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Trend</th>
                <th className="py-3 px-4">Payment Score</th>
                <th className="py-3 px-4">Renewal Score</th>
                <th className="py-3 px-4">Data Coverage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {scores.map((s) => {
                const numScore = Number(s.score);
                const isHealthy = s.category === 'HEALTHY';
                const isAttention = s.category === 'NEEDS_ATTENTION';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{s.customer_code}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm border font-mono shadow-xs"
                          style={{
                            backgroundColor: isHealthy ? '#ecfdf5' : isAttention ? '#fffbeb' : '#fef2f2',
                            color: isHealthy ? '#059669' : isAttention ? '#d97706' : '#dc2626',
                            borderColor: isHealthy ? '#a7f3d0' : isAttention ? '#fde68a' : '#fecaca',
                          }}
                        >
                          {Math.round(numScore)}
                        </div>
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${numScore}%`,
                              backgroundColor: isHealthy ? '#10b981' : isAttention ? '#f59e0b' : '#ef4444',
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[11px] border ${
                          isHealthy
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isAttention
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {s.category.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-xs">
                        {s.trend === 'IMPROVING' ? (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <TrendingUp className="w-3.5 h-3.5" /> Improving
                          </span>
                        ) : s.trend === 'DECLINING' ? (
                          <span className="text-rose-600 flex items-center gap-0.5">
                            <TrendingDown className="w-3.5 h-3.5" /> Declining
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-0.5">
                            <Minus className="w-3.5 h-3.5" /> Stable
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium">
                      {s.payment_reliability_score ? `${s.payment_reliability_score}%` : 'N/A'}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium">
                      {s.renewal_history_score ? `${s.renewal_history_score}%` : 'N/A'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                        <span>{s.data_coverage}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedScore(s)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                      >
                        Breakdown & Playbook
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Health Detail Modal */}
      {selectedScore && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-slate-900">{selectedScore.customer_name}</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedScore.customer_code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Health score evaluation computed on {new Date(selectedScore.computed_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedScore(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Health Score</div>
                <div className="text-3xl font-extrabold text-indigo-600 mt-0.5">
                  {selectedScore.score} <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category & Trend</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedScore.category.replace('_', ' ')} ({selectedScore.trend})</div>
              </div>
            </div>

            {/* 5 Component Signals */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3">5 Dimensional Signal Breakdown</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-slate-500 font-medium">Payment Reliability (30% weight)</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedScore.payment_reliability_score ? `${selectedScore.payment_reliability_score} / 100` : 'Unavailable'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-slate-500 font-medium">Renewal History (25% weight)</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedScore.renewal_history_score ? `${selectedScore.renewal_history_score} / 100` : 'Unavailable'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-slate-500 font-medium">Product Usage (20% weight)</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedScore.product_usage_score ? `${selectedScore.product_usage_score} / 100` : (
                      <span className="text-slate-400 font-normal text-xs italic">DATA_UNAVAILABLE (Normalized)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-slate-500 font-medium">Engagement (15% weight)</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedScore.customer_engagement_score ? `${selectedScore.customer_engagement_score} / 100` : (
                      <span className="text-slate-400 font-normal text-xs italic">DATA_UNAVAILABLE (Normalized)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white col-span-2">
                  <div className="text-slate-500 font-medium">Support History (10% weight)</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedScore.support_history_score ? `${selectedScore.support_history_score} / 100` : 'No Issues Reported (90/100)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Retention Playbook Actions */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Retention Recommendations & Playbooks</h4>
              {selectedScore.recommendations && selectedScore.recommendations.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedScore.recommendations.map((rec) => (
                    <div key={rec.id} className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          {rec.title}
                        </span>
                        <button
                          onClick={() => handleDismissRec(rec.id)}
                          className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                      <div className="text-slate-600 mt-1.5 leading-relaxed">{rec.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center border border-slate-200">
                  No active retention interventions required. Account is in good standing.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
