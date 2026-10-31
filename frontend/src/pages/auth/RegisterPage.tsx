import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowRight, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.register(formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1917] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-[#FAF7F5]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 rounded-md bg-[#211E1C] border border-[#403A35] mx-auto flex items-center justify-center text-[#EAB308] font-bold text-lg tracking-wide">
          S
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-[#FAF7F5] tracking-tight">
          Create Customer Account
        </h2>
        <p className="mt-1 text-xs text-[#A8A29E]">
          Subscribe and manage services on the Brightloop platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#292524] py-8 px-6 rounded-lg sm:px-8 border border-[#403A35]">
          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-[#211E1C] border border-[#D97770]/40 text-[#D97770] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  className="w-full px-3 py-2 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@acme.com"
                className="w-full px-3 py-2 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-semibold text-[#1C1917] bg-[#EAB308] hover:bg-[#CA8A04] focus:outline-none transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Register Account'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#403A35] text-center text-xs text-[#78716C]">
            <span>Already have an account? </span>
            <Link to="/login" className="text-[#EAB308] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
