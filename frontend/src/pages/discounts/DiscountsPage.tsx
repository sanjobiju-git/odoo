import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DiscountRule } from '../../types';
import { Percent, Plus, Shield, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DiscountsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Coupon validator tester widget
  const [testCode, setTestCode] = useState('WELCOME20');
  const [testSubtotal, setTestSubtotal] = useState('149.00');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const [newDiscount, setNewDiscount] = useState({
    name: '',
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: '20.00',
    min_purchase_amount: '0.00',
    min_quantity: 1,
    max_usage_count: 50,
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const data = await api.getDiscounts();
      setDiscounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDiscount(newDiscount as any);
      setShowAddModal(false);
      fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Error creating discount rule');
    }
  };

  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await api.validateDiscount({
        code: testCode,
        subtotal: testSubtotal,
      });
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({ valid: false, error: err.message });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Discount &amp; Promotion Rules</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Admin Restricted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage promotional codes, percentage and fixed reductions, and automated usage quotas.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount Rule</span>
          </button>
        )}
      </div>

      {/* Coupon Validator Interactive Widget */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Discount Eligibility &amp; Calculation Tester</span>
        </div>
        <form onSubmit={handleValidateCoupon} className="flex flex-col sm:flex-row items-center gap-3 text-xs">
          <input
            type="text"
            required
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            placeholder="PROMO CODE"
            className="w-full sm:w-48 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            required
            value={testSubtotal}
            onChange={(e) => setTestSubtotal(e.target.value)}
            placeholder="Subtotal ($)"
            className="w-full sm:w-36 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={validating}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold transition-colors disabled:opacity-50"
          >
            {validating ? 'Testing...' : 'Test Eligibility'}
          </button>
        </form>

        {validationResult && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-3 text-xs animate-in fade-in">
            {validationResult.valid ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Eligible!</strong> Applied discount: <strong>${validationResult.discount_amount}</strong> &bull; Adjusted subtotal: <strong>${validationResult.final_subtotal}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span><strong>Not Eligible:</strong> {validationResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Rule Name</th>
              <th className="py-3 px-4">Coupon Code</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Redemption Quota</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{d.code}</td>
                <td className="py-3 px-4 font-medium">{d.discount_type}</td>
                <td className="py-3 px-4 font-mono font-semibold">
                  {d.discount_type === 'PERCENTAGE' ? `${d.discount_value}%` : `$${d.discount_value}`}
                </td>
                <td className="py-3 px-4 font-mono">
                  {d.current_usage_count} / {d.max_usage_count || '∞'} used
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    d.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Discount Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create Discount Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                  placeholder="e.g. Q4 Growth Promo"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Promo Code</label>
                  <input
                    type="text"
                    required
                    value={newDiscount.code}
                    onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                    placeholder="GROWTH25"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={newDiscount.discount_type}
                    onChange={(e) => setNewDiscount({ ...newDiscount, discount_type: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Value</label>
                  <input
                    type="text"
                    required
                    value={newDiscount.discount_value}
                    onChange={(e) => setNewDiscount({ ...newDiscount, discount_value: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={newDiscount.max_usage_count}
                    onChange={(e) => setNewDiscount({ ...newDiscount, max_usage_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
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
                  Save Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
