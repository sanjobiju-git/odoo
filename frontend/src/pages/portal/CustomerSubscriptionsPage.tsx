import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Subscription, SubscriptionPlan } from '../../types';
import { Repeat, ArrowUpRight, Pause, XCircle, Check, X } from 'lucide-react';

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
    <div className="space-y-6 text-[#FAF7F5]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#FAF7F5]">My Subscriptions</h1>
        <p className="text-xs text-[#A8A29E] mt-1">Manage active software contracts, plan tiers, and billing renewal cycles.</p>
      </div>

      {activeSub ? (
        <div className="bg-[#292524] rounded-lg border border-[#403A35] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#403A35] pb-6">
            <div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#211E1C] text-[#EAB308] border border-[#403A35]">
                {activeSub.subscription_number}
              </span>
              <h2 className="text-xl font-semibold text-[#FAF7F5] mt-2">{activeSub.plan_name}</h2>
              <div className="text-xs text-[#A8A29E] mt-1">
                Started on {activeSub.start_date} &bull; Next renewal: <strong className="text-[#FAF7F5]">{activeSub.next_billing_date}</strong>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl font-bold text-[#FAF7F5]">${activeSub.total_amount}</div>
              <div className="text-xs text-[#78716C]">per {activeSub.billing_frequency.toLowerCase()}</div>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-medium bg-[#211E1C] text-[#65A882] border border-[#65A882]/30">
                {activeSub.status}
              </span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#EAB308] hover:bg-[#CA8A04] text-[#1C1917] font-semibold text-xs transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Change Subscription Plan</span>
            </button>

            {activeSub.status === 'ACTIVE' && (
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#211E1C] border border-[#403A35] text-[#FAF7F5] hover:bg-[#302B28] font-medium text-xs transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Subscription</span>
              </button>
            )}

            {activeSub.status !== 'CLOSED' && (
              <button
                onClick={handleCancelRequest}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#211E1C] border border-[#403A35] text-[#D97770] hover:bg-[#D97770]/10 font-medium text-xs transition-colors ml-auto"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Request Cancellation</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#292524] rounded-lg border border-[#403A35] text-[#78716C] text-sm">
          No active subscriptions found for this account.
        </div>
      )}

      {/* Change Subscription Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-[#1C1917]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#292524] rounded-lg max-w-md w-full border border-[#403A35] shadow-2xl p-6 space-y-4 text-[#FAF7F5]">
            <div className="flex items-center justify-between border-b border-[#403A35] pb-3">
              <h3 className="font-semibold text-[#FAF7F5] text-sm">Change Subscription Plan</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 rounded-md text-[#78716C] hover:text-[#FAF7F5] hover:bg-[#211E1C] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSwitchPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FAF7F5] mb-1.5">Available Plans</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#292524] text-[#FAF7F5] border border-[#403A35] rounded-md text-xs focus:outline-none focus:border-[#EAB308] cursor-pointer"
                >
                  <option value="" disabled className="text-[#A8A29E] bg-[#292524]">
                    Select a plan...
                  </option>
                  {availablePlans.map((p) => (
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
                  Plan change takes effect immediately on your next renewal date.
                </p>
              </div>

              <div className="pt-3 border-t border-[#403A35] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-3 py-1.5 rounded-md border border-[#403A35] text-[#A8A29E] hover:text-[#FAF7F5] hover:bg-[#211E1C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#EAB308] hover:bg-[#CA8A04] text-[#1C1917] font-semibold transition-colors"
                >
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
