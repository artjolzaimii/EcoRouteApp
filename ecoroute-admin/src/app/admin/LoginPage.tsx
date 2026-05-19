import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Leaf } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#2D8653] rounded-2xl flex items-center justify-center">
            <Leaf className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#B8D8C4]">
          <h1 className="text-2xl font-semibold text-[#1A1A1A] text-center mb-2">Admin Sign In</h1>
          <p className="text-sm text-[#666666] text-center mb-6">EcoRoute Admin Panel</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ecoroute.com"
                required
                className="w-full px-3 py-2 border border-[#B8D8C4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8653]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-[#B8D8C4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8653]"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2D8653] text-white font-medium rounded-lg hover:bg-[#1A5C38] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
