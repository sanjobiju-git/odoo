import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Subscription, SubscriptionPlan } from '../../types';
import { Repeat, ArrowUpRight, Pause, XCircle, Check, X, ShieldAlert } from 'lucide-react';

export const CustomerSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsData, plansData] = await Promise.all([
        api.getSubscriptions(),
        api.getPlans(),
      ]);
      setSubscriptions(subsData);
      setAvailablePlans(plansData);
      if (plansData.length > 0) {
        setSelectedPlanId(plansData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeSub = subscriptions[0];

  const handleSwitchPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    try {
      await api.switchSubscriptionPlan(activeSub.id, selectedPlanId);
      setShowUpgradeModal(false);
      fetchData();
      alert('Subscription plan successfully updated.');
    } catch (err: any) {
      alert(err.message || 'Error updating plan');
    }
  };

  const handlePause = async () => {
    if (!activeSub) return;
    const reason = prompt('Please enter pause reason:') || 'Customer requested pause';
    try {
      await api.pauseSubscription(activeSub.id, reason);
      fetchData();
      alert('Subscription paused.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeSub) return;
    if (!confirm('Are you sure you want to request subscription cancellation? Your access will conclude at the end of the current billing cycle.')) return;
    const reason = prompt('Feedback / Reason for cancellation:') || 'Cancellation request by customer';
    try {
      await api.cancelSubscription(activeSub.id, reason);
      fetchData();
      alert('Subscription cancellation recorded.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Subscriptions</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your active software contracts, upgrades, and cadence terms.</p>
      </div>

      {activeSub ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {activeSub.subscription_number}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{activeSub.plan_name}</h2>
              <div className="text-xs text-slate-500 mt-1">
                Started on {activeSub.start_date} &bull; Next renewal: <strong className="text-slate-800">{activeSub.next_billing_date}</strong>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-3xl font-extrabold text-slate-900">${activeSub.total_amount}</div>
              <div className="text-xs text-slate-400">per {activeSub.billing_frequency.toLowerCase()}</div>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeSub.status}
              </span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Upgrade / Switch Plan</span>
            </button>

            {activeSub.status === 'ACTIVE' && (
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Subscription</span>
              </button>
            )}

            {activeSub.status !== 'CLOSED' && (
              <button
                onClick={handleCancelRequest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-all ml-auto"
              >
                <XCircle className="w-4 h-4" />
                <span>Request Cancellation</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No active subscriptions found for this account.
        </div>
      )}

      {/* Upgrade / Switch Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Select New Subscription Tier</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSwitchPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Plans</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.plan_price}/{p.billing_frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500">
                  Confirm Plan Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
