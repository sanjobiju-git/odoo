import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      const userStr = localStorage.getItem('subsight_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'CUSTOMER') {
          navigate('/portal');
          return;
        }
      }
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Brightloop@2026!');
  };

  return (
    <div className="min-h-screen bg-[#1C1917] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-[#FAF7F5]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 rounded-md bg-[#211E1C] border border-[#403A35] mx-auto flex items-center justify-center text-[#EAB308] font-bold text-lg tracking-wide">
          S
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-[#FAF7F5] tracking-tight">
          SUBSIGHT
        </h2>
        <p className="mt-1 text-xs text-[#A8A29E]">
          Subscription Management & Intelligence Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#292524] py-8 px-6 rounded-lg sm:px-8 border border-[#403A35]">
          {/* Quick Demo Credential Selectors */}
          <div className="mb-6 p-3 rounded-md bg-[#211E1C] border border-[#403A35]">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#EAB308] uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-[#EAB308]" />
              <span>Quick Demo Personas</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@brightloop.com')}
                className="px-2.5 py-1.5 rounded bg-[#302B28] hover:bg-[#403A35] border border-[#403A35] text-[#FAF7F5] text-xs font-medium text-center transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff@brightloop.com')}
                className="px-2.5 py-1.5 rounded bg-[#302B28] hover:bg-[#403A35] border border-[#403A35] text-[#FAF7F5] text-xs font-medium text-center transition-colors"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@brightloop.com')}
                className="px-2.5 py-1.5 rounded bg-[#302B28] hover:bg-[#403A35] border border-[#403A35] text-[#FAF7F5] text-xs font-medium text-center transition-colors"
              >
                Customer
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-[#211E1C] border border-[#D97770]/40 text-[#D97770] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-semibold text-[#A8A29E] uppercase tracking-wider mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@brightloop.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-[#211E1C] border border-[#403A35] rounded-md text-xs text-[#FAF7F5] placeholder-[#78716C] focus:outline-none focus:border-[#EAB308] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-semibold text-[#1C1917] bg-[#EAB308] hover:bg-[#CA8A04] focus:outline-none transition-colors disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#403A35] text-center text-xs text-[#78716C]">
            <span>New customer? </span>
            <Link to="/register" className="text-[#EAB308] hover:underline font-medium">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
