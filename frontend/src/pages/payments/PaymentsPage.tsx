import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Payment, Invoice } from '../../types';
import { CreditCard, Plus, CheckCircle2, Search, X, Check, ArrowRight } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    invoice: '',
    amount: '',
    payment_method: 'CARD',
    transaction_reference: '',
    notes: '',
  });

  const [reconcileForm, setReconcileForm] = useState({
    statement_reference: '',
    amount: '',
    statement_date: new Date().toISOString().split('T')[0],
  });
  const [reconcileResult, setReconcileResult] = useState<any>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [payData, invData] = await Promise.all([
        api.getPayments(),
        api.getInvoices(),
      ]);
      setPayments(payData);
      const openInvs = invData.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
      setInvoices(openInvs);
      if (openInvs.length > 0 && !paymentForm.invoice) {
        setPaymentForm((prev) => ({ ...prev, invoice: openInvs[0].id, amount: openInvs[0].balance_due }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleInvoiceChange = (invId: string) => {
    const inv = invoices.find((i) => i.id === invId);
    setPaymentForm({
      ...paymentForm,
      invoice: invId,
      amount: inv ? inv.balance_due : paymentForm.amount,
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPayment(paymentForm);
      setShowRecordModal(false);
      fetchPayments();
      alert('Payment recorded and allocated successfully.');
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  };

  const handleReconcileMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.matchReconciliation(reconcileForm);
      setReconcileResult(res);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payments &amp; Reconciliation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Payment settlement ledger, automatic invoice allocation, and bank statement reference matching.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setReconcileResult(null);
              setShowReconcileModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
          >
            Bank Statement Match
          </button>
          <button
            onClick={() => setShowRecordModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Transaction Ref</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Reconciliation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.transaction_reference}</td>
                <td className="py-3 px-4 font-mono text-indigo-600">{p.invoice_number}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{p.customer_name}</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-600">${p.amount} {p.currency}</td>
                <td className="py-3 px-4 font-medium text-slate-600">{p.payment_method.replace('_', ' ')}</td>
                <td className="py-3 px-4 text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    p.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-[11px] font-medium text-slate-500">
                    {p.is_reconciled ? 'Matched & Check;' : 'Ledger Stamped'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Payment</h3>
              <button onClick={() => setShowRecordModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Open Invoice</label>
                <select
                  value={paymentForm.invoice}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.customer_name_snapshot} (Balance: ${inv.balance_due})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($)</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  >
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer (Wire)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500">
                  Record &amp; Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Reconciliation Modal */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Bank Statement Reconciliation</h3>
              <button onClick={() => setShowReconcileModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reconcileResult ? (
              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-xl border ${
                  reconcileResult.status === 'MATCHED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="font-bold text-sm">Status: {reconcileResult.status}</div>
                  <div className="mt-1">{reconcileResult.review_notes}</div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setShowReconcileModal(false)} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReconcileMatch} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Statement Reference / TXN ID</label>
                  <input
                    type="text"
                    required
                    value={reconcileForm.statement_reference}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, statement_reference: e.target.value })}
                    placeholder="e.g. TXN-PAID-0-INV-..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Statement Amount ($)</label>
                    <input
                      type="text"
                      required
                      value={reconcileForm.amount}
                      onChange={(e) => setReconcileForm({ ...reconcileForm, amount: e.target.value })}
                      placeholder="149.00"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Statement Date</label>
                    <input
                      type="date"
                      required
                      value={reconcileForm.statement_date}
                      onChange={(e) => setReconcileForm({ ...reconcileForm, statement_date: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReconcileModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500">
                    Run Auto-Match
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
