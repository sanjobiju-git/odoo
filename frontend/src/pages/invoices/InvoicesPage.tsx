import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Invoice } from '../../types';
import {
  Receipt, Play, CheckCircle2, Clock, FileDown,
  Printer, X, AlertCircle, RefreshCw, Calendar
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRunBillingModal, setShowRunBillingModal] = useState(false);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [runningBilling, setRunningBilling] = useState(false);
  const [billingReport, setBillingReport] = useState<any>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleRunBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningBilling(true);
    setBillingReport(null);
    try {
      const res = await api.runRecurringBilling(billingDate);
      setBillingReport(res);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Billing execution failed');
    } finally {
      setRunningBilling(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await api.confirmInvoice(id);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to void this invoice?')) return;
    try {
      await api.cancelInvoice(id);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openInvoicePrint = (id: string) => {
    window.open(`/api/v1/invoices/${id}/pdf/`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices &amp; Recurring Billing</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated invoice generation, tax &amp; discount snapshots, balance due, and printable PDF copies.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBillingReport(null);
              setShowRunBillingModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Recurring Billing Batch</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Invoice Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Balance Due</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoices.map((inv) => {
              const isPaid = inv.status === 'PAID';
              const isConfirmed = inv.status === 'CONFIRMED';
              const isOverdue = inv.is_overdue;

              return (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{inv.customer_name_snapshot}</div>
                    <div className="text-[11px] text-slate-400">Sub: {inv.subscription_number || 'Direct'}</div>
                  </td>
                  <td className="py-3 px-4 font-medium">{inv.invoice_date}</td>
                  <td className="py-3 px-4 font-medium">
                    <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>{inv.due_date}</span>
                    {isOverdue && (
                      <span className="ml-1 text-[10px] font-bold text-rose-600 uppercase bg-rose-50 px-1 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    ${inv.total_amount} {inv.currency}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold" style={{ color: Number(inv.balance_due) > 0 ? '#d97706' : '#10b981' }}>
                    ${inv.balance_due}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isConfirmed
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => handleConfirm(inv.id)}
                          className="px-2 py-1 rounded bg-indigo-600 text-white font-semibold text-xs"
                        >
                          Confirm
                        </button>
                      )}

                      <button
                        onClick={() => openInvoicePrint(inv.id)}
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Download / Print PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {inv.status !== 'CANCELLED' && !isPaid && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Run Billing Modal */}
      {showRunBillingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Execute Recurring Billing Batch</h3>
              <button onClick={() => setShowRunBillingModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {billingReport ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                  <div className="font-bold text-sm">Billing Batch Executed Successfully</div>
                  <div>Subscriptions Evaluated: {billingReport.total_evaluated}</div>
                  <div>Invoices Created: {billingReport.invoices_created}</div>
                  <div>Skipped (Already Billed / Not Due): {billingReport.skipped_duplicates}</div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRunBillingModal(false)}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRunBilling} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Evaluation Date</label>
                  <input
                    type="date"
                    required
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Evaluates all active subscriptions with next_billing_date on or before this date. Idempotency guarantees no duplicates are created.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRunBillingModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={runningBilling}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {runningBilling ? 'Generating Invoices...' : 'Start Billing Run'}
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
