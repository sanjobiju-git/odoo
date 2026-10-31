import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Customer, Subscription, Invoice } from '../../types';
import {
  Repeat, Receipt, DollarSign, Calendar, Clock,
  ArrowRight, Printer, AlertTriangle, CheckCircle2, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerPortalOverview: React.FC = () => {
  const [profile, setProfile] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, subsData, invsData] = await Promise.all([
          api.getMyCustomerProfile().catch(() => null),
          api.getSubscriptions(),
          api.getInvoices(),
        ]);
        setProfile(profData);
        setSubscriptions(subsData);
        setInvoices(invsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeSub = subscriptions.find((s) => s.status === 'ACTIVE') || subscriptions[0];
  const pendingInvoices = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
  const totalBalanceDue = pendingInvoices.reduce((acc, curr) => acc + parseFloat(curr.balance_due || '0'), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Customer Account Console</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {profile?.company_name || 'My Business Account'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Account Code: <strong className="text-white">{profile?.customer_code || 'CUST-DEMO'}</strong> &bull; Currency: {profile?.currency || 'USD'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/portal/subscriptions"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-md shadow-indigo-600/30 transition-colors"
          >
            Manage Subscription
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Subscription Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Contract</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {activeSub ? activeSub.plan_name : 'No Active Plan'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {activeSub ? `$${activeSub.total_amount} / ${activeSub.billing_frequency.toLowerCase()}` : 'Contact sales to start subscription'}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Contract Status:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
              {activeSub?.status || 'INACTIVE'}
            </span>
          </div>
        </div>

        {/* Next Renewal Date */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Next Billing Date</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {activeSub?.next_billing_date || 'N/A'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Automatic renewal active ({activeSub?.auto_renew ? 'Enabled' : 'Disabled'})
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Terms:</span>
            <span className="font-semibold text-slate-800">{profile?.payment_terms_days || 30} Days Net</span>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Balance Due</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold" style={{ color: totalBalanceDue > 0 ? '#d97706' : '#10b981' }}>
              ${totalBalanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {pendingInvoices.length} unpaid / pending invoice(s)
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Action:</span>
            <Link to="/portal/invoices" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
              Review &amp; Pay <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Invoices</h3>
            <p className="text-xs text-slate-500">Download printable PDF statements and review billing history.</p>
          </div>
          <Link to="/portal/invoices" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            View All Invoices &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3 px-4 font-medium">{inv.invoice_date}</td>
                  <td className="py-3 px-4">{inv.due_date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">${inv.total_amount}</td>
                  <td className="py-3 px-4 font-mono font-bold" style={{ color: Number(inv.balance_due) > 0 ? '#d97706' : '#10b981' }}>
                    ${inv.balance_due}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`/api/v1/invoices/${inv.id}/pdf/`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
