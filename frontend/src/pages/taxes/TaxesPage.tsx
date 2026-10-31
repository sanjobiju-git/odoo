import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TaxRule } from '../../types';
import { Landmark, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TaxesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTax, setNewTax] = useState({
    name: '',
    code: '',
    rate_percentage: '20.0000',
    tax_type: 'PERCENTAGE',
  });

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const data = await api.getTaxes();
      setTaxes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTax(newTax as any);
      setShowAddModal(false);
      fetchTaxes();
    } catch (err: any) {
      alert(err.message || 'Error creating tax rule');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tax Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Jurisdiction tax percentage rules with immutable invoice snapshotting.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tax Rule</span>
          </button>
        )}
      </div>

      {/* Taxes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Tax Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Rate Percentage</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {taxes.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{t.code}</td>
                <td className="py-3 px-4 font-medium">{t.tax_type}</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{t.rate_percentage}%</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Tax Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Tax Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTax} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax Name</label>
                <input
                  type="text"
                  required
                  value={newTax.name}
                  onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                  placeholder="e.g. EU Standard VAT 20%"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax Code</label>
                <input
                  type="text"
                  required
                  value={newTax.code}
                  onChange={(e) => setNewTax({ ...newTax, code: e.target.value })}
                  placeholder="TAX-VAT-20"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rate Percentage (%)</label>
                <input
                  type="text"
                  required
                  value={newTax.rate_percentage}
                  onChange={(e) => setNewTax({ ...newTax, rate_percentage: e.target.value })}
                  placeholder="20.0000"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
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
                  Save Tax Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
