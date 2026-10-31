import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Quotation, Customer, SubscriptionPlan, Product } from '../../types';
import { FileText, Plus, Check, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer: '',
    plan: '',
    quantity: 1,
    unit_price: '99.00',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quoData, custData, plansData] = await Promise.all([
        api.getQuotations(),
        api.getCustomers(),
        api.getPlans(),
      ]);
      setQuotations(quoData);
      setCustomers(custData);
      setPlans(plansData);
      if (custData.length > 0 && !form.customer) {
        setForm((prev) => ({ ...prev, customer: custData[0].id }));
      }
      if (plansData.length > 0 && !form.plan) {
        setForm((prev) => ({ ...prev, plan: plansData[0].id, unit_price: plansData[0].plan_price }));
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

  const handlePlanChange = (planId: string) => {
    const selected = plans.find((p) => p.id === planId);
    setForm({
      ...form,
      plan: planId,
      unit_price: selected ? selected.plan_price : form.unit_price,
    });
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlan = plans.find((p) => p.id === form.plan);
    if (!selectedPlan) return;

    try {
      await api.createQuotation({
        customer: form.customer,
        notes: form.notes,
        lines: [
          {
            product: selectedPlan.product,
            plan: selectedPlan.id,
            description: `${selectedPlan.name} (${selectedPlan.billing_frequency})`,
            quantity: form.quantity,
            unit_price: form.unit_price,
          },
        ],
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating quotation');
    }
  };

  const handleConvert = async (quotationId: string) => {
    setConvertingId(quotationId);
    try {
      const res = await api.convertQuotation(quotationId);
      alert(res.message);
      await fetchData();
      navigate('/app/subscriptions');
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quotations &amp; Proposals</h1>
          <p className="text-xs text-slate-500 mt-0.5">Prepare enterprise contracts, review customer approval, and convert to active subscriptions with 1 click.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Quotation #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Valid Until</th>
              <th className="py-3 px-4">Subtotal</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {quotations.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{q.quotation_number}</td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{q.customer_name}</div>
                  <div className="text-[11px] text-slate-400">{q.customer_email}</div>
                </td>
                <td className="py-3 px-4 font-medium">{q.valid_until}</td>
                <td className="py-3 px-4 font-mono">${q.subtotal}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">${q.total_amount} {q.currency}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    q.status === 'CONVERTED'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : q.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {q.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {q.status !== 'CONVERTED' ? (
                    <button
                      onClick={() => handleConvert(q.id)}
                      disabled={convertingId === q.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{convertingId === q.id ? 'Converting...' : 'Convert to Subscription'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-purple-700 font-semibold">Active Subscription &check;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Generate Quotation</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer</label>
                <select
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.customer_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.plan_price}/{p.billing_frequency}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price ($)</label>
                  <input
                    type="text"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  placeholder="Payment within 30 days. Includes standard onboarding."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500">
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
