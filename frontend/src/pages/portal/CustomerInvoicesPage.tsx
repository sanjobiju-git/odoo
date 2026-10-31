import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Invoice } from '../../types';
import { Receipt, Printer, CreditCard, Check, X, AlertCircle } from 'lucide-react';

export const CustomerInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);

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

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;
    setPaying(true);
    try {
      await api.recordPayment({
        invoice: selectedInvoiceForPay.id,
        amount: paymentAmount,
        payment_method: 'CARD',
      });
      setSelectedInvoiceForPay(null);
      fetchInvoices();
      alert('Payment processed successfully. Invoice settled!');
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Billing &amp; Invoices</h1>
        <p className="text-xs text-slate-500 mt-0.5">View historical invoices, download PDF statements, and pay open balances.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Due Date</th>
              <th className="py-3.5 px-4">Total Amount</th>
              <th className="py-3.5 px-4">Balance Due</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoices.map((inv) => {
              const isPaid = inv.status === 'PAID';
              const hasBalance = Number(inv.balance_due) > 0;

              return (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3.5 px-4 font-medium">{inv.invoice_date}</td>
                  <td className="py-3.5 px-4 font-medium">{inv.due_date}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">${inv.total_amount} {inv.currency}</td>
                  <td className="py-3.5 px-4 font-mono font-bold" style={{ color: hasBalance ? '#d97706' : '#10b981' }}>
                    ${inv.balance_due}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {hasBalance && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceForPay(inv);
                            setPaymentAmount(inv.balance_due);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs"
                        >
                          Pay Now
                        </button>
                      )}

                      <a
                        href={`/api/v1/invoices/${inv.id}/pdf/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pay Invoice Modal */}
      {selectedInvoiceForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Settle Invoice</h3>
                <span className="text-xs text-slate-500">{selectedInvoiceForPay.invoice_number}</span>
              </div>
              <button onClick={() => setSelectedInvoiceForPay(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Balance Due:</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  ${selectedInvoiceForPay.balance_due} {selectedInvoiceForPay.currency}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount ($)</label>
                <input
                  type="text"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Simulated Card Token</label>
                <input
                  type="text"
                  disabled
                  value="•••• •••• •••• 4242 (Visa Corporate)"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPay(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50"
                >
                  {paying ? 'Processing...' : 'Authorize & Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
