'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { Logo } from '../../components/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/calendar');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-surface border border-surface-dark rounded-lg shadow-sm p-6 md:p-8">
        <div className="mb-6 md:mb-8 text-center">
          <Logo className="justify-center mb-2" />
          <p className="text-xs md:text-sm text-gray-600 mt-2">Employee Ordering</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@company.com"
              className="w-full px-3 py-2.5 border border-surface-dark rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-background"
            />
          </div>

          {error && (
            <div className="bg-warning-50 border border-warning-300 rounded-md p-3">
              <p className="text-sm text-warning-800 font-normal">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-xs md:text-sm text-gray-500 text-center">
          Enter your company email to access meal ordering
        </p>
      </div>
    </div>
  );
}
