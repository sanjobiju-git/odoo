import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Customer } from '../../types';
import { Users, Search, Plus, ExternalLink, ShieldCheck, AlertCircle, X, Check, Mail, Phone, MapPin } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    company_name: '',
    billing_email: '',
    phone: '',
    tax_id: '',
    payment_terms_days: 30,
    credit_limit: '10000.00',
    billing_address: '',
  });

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers({ search });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(newCustomer as any);
      setShowAddModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer CRM</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer profiles, billing terms, active contracts, and health indicators.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies or emails..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Terms</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Active Subs</th>
              <th className="py-3 px-4">Health Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{c.company_name}</div>
                  <div className="text-[11px] text-slate-400">{c.customer_code} &bull; Tax ID: {c.tax_id || 'N/A'}</div>
                </td>
                <td className="py-3 px-4">
                  <div>{c.billing_email}</div>
                  <div className="text-[11px] text-slate-400">{c.phone || 'No phone'}</div>
                </td>
                <td className="py-3 px-4 font-medium">
                  {c.payment_terms_days} Days
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {c.active_subscriptions_count ?? 1}
                </td>
                <td className="py-3 px-4">
                  {c.latest_health_score ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                      c.latest_health_score.category === 'HEALTHY'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : c.latest_health_score.category === 'NEEDS_ATTENTION'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      Score {Math.round(c.latest_health_score.score)} &bull; {c.latest_health_score.category.replace('_', ' ')}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Evaluating</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    360° Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer 360 Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">{selectedCustomer.company_name}</h3>
                <span className="text-xs text-slate-500">{selectedCustomer.customer_code}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{selectedCustomer.billing_email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{selectedCustomer.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{selectedCustomer.billing_address || 'No billing address recorded'}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Payment Terms:</span>
                  <div className="font-bold text-slate-800">{selectedCustomer.payment_terms_days} Days</div>
                </div>
                <div>
                  <span className="text-slate-400">Credit Limit:</span>
                  <div className="font-bold text-slate-800">${selectedCustomer.credit_limit} {selectedCustomer.currency}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={newCustomer.company_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company_name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  placeholder="Apex Cloud Systems"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Email</label>
                <input
                  type="email"
                  required
                  value={newCustomer.billing_email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, billing_email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  placeholder="billing@apexcloud.io"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax / VAT ID</label>
                  <input
                    type="text"
                    value={newCustomer.tax_id}
                    onChange={(e) => setNewCustomer({ ...newCustomer, tax_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={newCustomer.payment_terms_days}
                    onChange={(e) => setNewCustomer({ ...newCustomer, payment_terms_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit ($)</label>
                  <input
                    type="text"
                    value={newCustomer.credit_limit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  value={newCustomer.billing_address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, billing_address: e.target.value })}
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
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
