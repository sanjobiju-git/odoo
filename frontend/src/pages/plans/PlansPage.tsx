import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SubscriptionPlan, Product } from '../../types';
import { Sliders, Plus, Check, Calendar, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PlansPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newPlan, setNewPlan] = useState({
    name: '',
    code: '',
    product: '',
    billing_frequency: 'MONTHLY',
    plan_price: '99.00',
    trial_period_days: 14,
    allow_pause: true,
    allow_renewal: true,
    description: '',
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const [plansData, prodsData] = await Promise.all([
        api.getPlans(),
        api.getProducts(),
      ]);
      setPlans(plansData);
      setProducts(prodsData);
      if (prodsData.length > 0 && !newPlan.product) {
        setNewPlan((prev) => ({ ...prev, product: prodsData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlan(newPlan as any);
      setShowAddModal(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Error creating plan');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-slate-500 mt-0.5">Recurring billing tiers, supported frequencies, trial rules, and pause permissions.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        )}
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {plan.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {plan.billing_frequency}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{plan.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">Product: {plan.product_name}</div>
                <p className="text-xs text-slate-500 mt-2">{plan.description || 'Flexible recurring software tier.'}</p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">${plan.plan_price}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {plan.billing_frequency.toLowerCase()}</span>
                </div>
                {plan.trial_period_days > 0 && (
                  <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{plan.trial_period_days}-day complimentary trial</span>
                  </div>
                )}
              </div>

              {/* Rules List */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Customer Pause Permission:</span>
                  <span className="font-semibold">{plan.allow_pause ? 'Allowed' : 'Locked'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto Renewal:</span>
                  <span className="font-semibold">{plan.allow_renewal ? 'Supported' : 'Manual'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className={`w-full block text-center py-2 rounded-lg text-xs font-semibold ${
                plan.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {plan.status === 'ACTIVE' ? 'Active Catalog Tier' : 'Archived'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create Subscription Plan</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="Business Pro (Annual)"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan Code</label>
                  <input
                    type="text"
                    required
                    value={newPlan.code}
                    onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })}
                    placeholder="PLAN-PRO-ANNUAL"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Associated Product</label>
                  <select
                    value={newPlan.product}
                    onChange={(e) => setNewPlan({ ...newPlan, product: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Cadence</label>
                  <select
                    value={newPlan.billing_frequency}
                    onChange={(e) => setNewPlan({ ...newPlan, billing_frequency: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price per Cycle ($)</label>
                  <input
                    type="text"
                    required
                    value={newPlan.plan_price}
                    onChange={(e) => setNewPlan({ ...newPlan, plan_price: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trial Period (Days)</label>
                <input
                  type="number"
                  value={newPlan.trial_period_days}
                  onChange={(e) => setNewPlan({ ...newPlan, trial_period_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500">
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
