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
    <div className="space-y-6 max-w-7xl mx-auto text-[#FAF7F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#403A35]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[#FAF7F5]">Subscription Lifecycle</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#211E1C] border border-[#403A35] text-[#A8A29E]">
              Contracts
            </span>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1">
            Manage live subscriptions, pause/resume, upgrades, cancellations, and chronological audit timelines.
          </p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[#292524] rounded-lg border border-[#403A35] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#211E1C] text-[#78716C] font-semibold uppercase tracking-wider border-b border-[#403A35]">
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
          <tbody className="divide-y divide-[#403A35] text-[#A8A29E]">
            {subscriptions.map((s) => {
              const isActive = s.status === 'ACTIVE';
              const isConfirmed = s.status === 'CONFIRMED';
              const isPaused = s.status === 'PAUSED';
              const isClosed = s.status === 'CLOSED';

              return (
                <tr key={s.id} className="hover:bg-[#211E1C]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-[#FAF7F5]">{s.subscription_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#FAF7F5]">{s.customer_name}</div>
                    <div className="text-[11px] text-[#78716C]">{s.customer_email}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#FAF7F5]">{s.plan_name}</td>
                  <td className="py-3 px-4 text-[#A8A29E]">{s.billing_frequency}</td>
                  <td className="py-3 px-4 font-mono text-[#A8A29E]">{s.next_billing_date}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#FAF7F5]">${s.total_amount} {s.currency}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                      isActive
                        ? 'bg-[#211E1C] text-[#65A882] border-[#65A882]/30'
                        : isConfirmed
                        ? 'bg-[#211E1C] text-[#FAF7F5] border-[#403A35]'
                        : isPaused
                        ? 'bg-[#211E1C] text-[#EAB308] border-[#EAB308]/30'
                        : 'bg-[#211E1C] text-[#78716C] border-[#403A35]'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {isConfirmed && (
                        <button
                          onClick={() => handleActivate(s.id)}
                          className="px-2.5 py-1 rounded bg-[#65A882] hover:opacity-90 text-[#1C1917] font-semibold text-xs transition-opacity"
                        >
                          Activate
                        </button>
                      )}

                      {isActive && (
                        <>
                          <button
                            onClick={() => handlePause(s.id)}
                            className="p-1.5 rounded bg-[#211E1C] hover:bg-[#302B28] border border-[#403A35] text-[#FAF7F5] transition-colors"
                            title="Pause Subscription"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubForSwitch(s);
                              setNewPlanId(s.plan);
                            }}
                            className="px-2.5 py-1 rounded bg-[#211E1C] hover:bg-[#302B28] border border-[#403A35] text-[#EAB308] font-medium text-xs transition-colors"
                          >
                            Change Plan
                          </button>
                          <button
                            onClick={() => handleRenew(s.id)}
                            className="px-2 py-1 rounded bg-[#211E1C] hover:bg-[#302B28] border border-[#403A35] text-[#A8A29E] hover:text-[#FAF7F5] text-xs transition-colors"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="p-1.5 rounded bg-[#211E1C] hover:bg-[#D97770]/10 border border-[#403A35] text-[#D97770] transition-colors"
                            title="Cancel Subscription"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isPaused && (
                        <button
                          onClick={() => handleResume(s.id)}
                          className="px-2.5 py-1 rounded bg-[#EAB308] hover:bg-[#CA8A04] text-[#1C1917] font-semibold text-xs transition-colors"
                        >
                          Resume
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedSubForTimeline(s)}
                        className="p-1.5 rounded hover:bg-[#302B28] text-[#78716C] hover:text-[#FAF7F5] transition-colors"
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

      {/* Change Subscription Plan Modal */}
      {selectedSubForSwitch && (
        <div className="fixed inset-0 bg-[#1C1917]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#292524] rounded-lg max-w-md w-full border border-[#403A35] shadow-2xl p-6 space-y-4 text-[#FAF7F5]">
            <div className="flex items-center justify-between border-b border-[#403A35] pb-3">
              <div>
                <h3 className="font-semibold text-[#FAF7F5] text-sm">Change Subscription Plan</h3>
                <span className="text-[11px] text-[#A8A29E]">{selectedSubForSwitch.subscription_number}</span>
              </div>
              <button
                onClick={() => setSelectedSubForSwitch(null)}
                className="p-1 rounded-md text-[#78716C] hover:text-[#FAF7F5] hover:bg-[#211E1C] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSwitchPlan} className="space-y-4 text-xs">
              <div className="p-3 rounded-md bg-[#211E1C] border border-[#403A35]">
                <span className="text-[11px] text-[#78716C] uppercase font-semibold">Current Plan:</span>
                <div className="font-semibold text-[#FAF7F5] text-sm mt-0.5">
                  {selectedSubForSwitch.plan_name} (${selectedSubForSwitch.total_amount}/{selectedSubForSwitch.billing_frequency})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#FAF7F5] mb-1.5">Target Plan</label>
                <select
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#292524] text-[#FAF7F5] border border-[#403A35] rounded-md text-xs focus:outline-none focus:border-[#EAB308] cursor-pointer"
                >
                  <option value="" disabled className="text-[#A8A29E] bg-[#292524]">
                    Select target plan...
                  </option>
                  {plans.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      className="bg-[#292524] text-[#FAF7F5] py-2"
                    >
                      {p.name} - ${p.plan_price}/{p.billing_frequency}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#78716C] mt-1.5">
                  Changing plan recalculates subsequent renewal cycles immediately.
                </p>
              </div>

              <div className="pt-3 border-t border-[#403A35] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubForSwitch(null)}
                  className="px-3 py-1.5 rounded-md border border-[#403A35] text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#EAB308] hover:bg-[#CA8A04] text-[#1C1917] font-semibold transition-colors"
                >
                  Confirm Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Drawer */}
      {selectedSubForTimeline && (
        <div className="fixed inset-0 bg-[#1C1917]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#292524] rounded-lg max-w-lg w-full border border-[#403A35] shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto text-[#FAF7F5]">
            <div className="flex items-center justify-between border-b border-[#403A35] pb-3">
              <div>
                <h3 className="font-semibold text-[#FAF7F5] text-sm">Subscription Audit History</h3>
                <span className="text-[11px] text-[#A8A29E]">{selectedSubForTimeline.subscription_number}</span>
              </div>
              <button
                onClick={() => setSelectedSubForTimeline(null)}
                className="p-1 rounded-md text-[#78716C] hover:text-[#FAF7F5] hover:bg-[#211E1C] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {selectedSubForTimeline.events && selectedSubForTimeline.events.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#403A35]">
                  {selectedSubForTimeline.events.map((ev) => (
                    <div key={ev.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#EAB308]"></div>
                      <div className="font-medium text-[#FAF7F5] flex items-center justify-between">
                        <span>{ev.event_type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-[#78716C] font-normal">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[#A8A29E] mt-0.5">{ev.details}</div>
                      <div className="text-[10px] text-[#78716C] mt-0.5">Actor: {ev.actor_email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[#78716C] italic">No events recorded.</div>
              )}
            </div>

            <div className="pt-3 border-t border-[#403A35] flex justify-end">
              <button
                onClick={() => setSelectedSubForTimeline(null)}
                className="px-3.5 py-1.5 rounded-md bg-[#211E1C] border border-[#403A35] text-[#A8A29E] hover:text-[#FAF7F5] text-xs transition-colors"
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
