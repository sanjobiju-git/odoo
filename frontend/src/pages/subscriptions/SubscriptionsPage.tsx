import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Subscription, SubscriptionPlan } from '../../types';
import {
  Repeat, Play, Pause, XCircle, ArrowUpRight,
  Clock, CheckCircle2, History, ChevronRight, X
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubForSwitch, setSelectedSubForSwitch] = useState<Subscription | null>(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [selectedSubForTimeline, setSelectedSubForTimeline] = useState<Subscription | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const [subsData, plansData] = await Promise.all([
        api.getSubscriptions(),
        api.getPlans(),
      ]);
      setSubscriptions(subsData);
      setPlans(plansData);
      if (plansData.length > 0 && !newPlanId) {
        setNewPlanId(plansData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleActivate = async (id: string) => {
    try {
      await api.activateSubscription(id);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePause = async (id: string) => {
    const reason = prompt('Reason for pausing subscription:') || 'Customer requested temporary pause';
    try {
      await api.pauseSubscription(id, reason);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.resumeSubscription(id);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    const reason = prompt('Cancellation reason:') || 'Cancelled by staff';
    try {
      await api.cancelSubscription(id, reason);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await api.renewSubscription(id);
      fetchSubscriptions();
      alert('Subscription renewed successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSwitchPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForSwitch) return;
    try {
      await api.switchSubscriptionPlan(selectedSubForSwitch.id, newPlanId);
      setSelectedSubForSwitch(null);
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subscription Lifecycle</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage live subscriptions, pause/resume, upgrades, cancellations, and audit timelines.</p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Subscription #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Active Plan</th>
              <th className="py-3 px-4">Cadence</th>
              <th className="py-3 px-4">Next Billing Date</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {subscriptions.map((s) => {
              const isActive = s.status === 'ACTIVE';
              const isConfirmed = s.status === 'CONFIRMED';
              const isPaused = s.status === 'PAUSED';
              const isClosed = s.status === 'CLOSED';

              return (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.subscription_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{s.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{s.customer_email}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.plan_name}</td>
                  <td className="py-3 px-4 text-slate-500">{s.billing_frequency}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{s.next_billing_date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">${s.total_amount} {s.currency}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isConfirmed
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : isPaused
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {isConfirmed && (
                        <button
                          onClick={() => handleActivate(s.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                        >
                          Activate
                        </button>
                      )}

                      {isActive && (
                        <>
                          <button
                            onClick={() => handlePause(s.id)}
                            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Pause Subscription"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubForSwitch(s);
                              setNewPlanId(s.plan);
                            }}
                            className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs"
                          >
                            Switch Plan
                          </button>
                          <button
                            onClick={() => handleRenew(s.id)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600"
                            title="Cancel Subscription"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isPaused && (
                        <button
                          onClick={() => handleResume(s.id)}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                        >
                          Resume
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedSubForTimeline(s)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        title="Audit History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Switch / Upgrade Plan Modal */}
      {selectedSubForSwitch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Upgrade or Downgrade Plan</h3>
                <span className="text-xs text-slate-500">{selectedSubForSwitch.subscription_number}</span>
              </div>
              <button onClick={() => setSelectedSubForSwitch(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSwitchPlan} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500">Current Plan:</span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                  {selectedSubForSwitch.plan_name} (${selectedSubForSwitch.total_amount}/{selectedSubForSwitch.billing_frequency})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Plan</label>
                <select
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.plan_price}/{p.billing_frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubForSwitch(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500">
                  Confirm Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Drawer */}
      {selectedSubForTimeline && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Subscription Audit History</h3>
                <span className="text-xs text-slate-500">{selectedSubForTimeline.subscription_number}</span>
              </div>
              <button onClick={() => setSelectedSubForTimeline(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {selectedSubForTimeline.events && selectedSubForTimeline.events.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedSubForTimeline.events.map((ev) => (
                    <div key={ev.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{ev.event_type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{ev.details}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Actor: {ev.actor_email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 italic">No events recorded.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSubForTimeline(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
