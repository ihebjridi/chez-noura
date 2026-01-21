'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { DailyMenuDto, DailyMenuStatus, UserRole } from '@contracts/core';
import Link from 'next/link';

export default function DailyMenusPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [dailyMenus, setDailyMenus] = useState<DailyMenuDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDate, setCreateDate] = useState('');

  useEffect(() => {
    loadDailyMenus();
  }, []);

  const loadDailyMenus = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getDailyMenus();
      setDailyMenus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load daily menus');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDate) {
      setError('Please select a date');
      return;
    }

    try {
      setError('');
      const newMenu = await apiClient.createDailyMenu({ date: createDate });
      setShowCreateForm(false);
      setCreateDate('');
      router.push(`/daily-menus/${newMenu.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create daily menu');
    }
  };

  const getStatusBadgeColor = (status: DailyMenuStatus) => {
    switch (status) {
      case DailyMenuStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case DailyMenuStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 border-green-300';
      case DailyMenuStatus.LOCKED:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActionButton = (menu: DailyMenuDto) => {
    switch (menu.status) {
      case DailyMenuStatus.DRAFT:
        return (
          <Link
            href={`/daily-menus/${menu.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
        );
      case DailyMenuStatus.PUBLISHED:
        return (
          <div className="flex gap-2">
            <Link
              href={`/daily-menus/${menu.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              View
            </Link>
            <Link
              href={`/daily-menus/${menu.id}`}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Lock
            </Link>
          </div>
        );
      case DailyMenuStatus.LOCKED:
        return (
          <Link
            href={`/daily-menus/${menu.id}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            View Summary
          </Link>
        );
      default:
        return null;
    }
  };

  // Check if a menu exists for today
  const today = new Date().toISOString().split('T')[0];
  const hasTodayMenu = dailyMenus.some((menu) => menu.date === today);

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline mr-4">
              ← Dashboard
            </Link>
            <h1 className="inline text-3xl font-bold">Daily Menus</h1>
          </div>
          <div className="flex gap-2">
            {!hasTodayMenu && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {showCreateForm ? 'Cancel' : '+ Create Daily Menu'}
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {showCreateForm && (
          <form
            onSubmit={handleCreate}
            className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-4">Create Daily Menu</h2>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Date *</label>
              <input
                type="date"
                value={createDate}
                onChange={(e) => setCreateDate(e.target.value)}
                required
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateDate('');
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading daily menus...</p>
          </div>
        ) : dailyMenus.length === 0 ? (
          <div className="p-12 text-center border border-gray-200 rounded-lg bg-white">
            <p className="text-gray-600">No daily menus found. Create your first daily menu to get started.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyMenus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(menu.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                          menu.status,
                        )}`}
                      >
                        {menu.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {menu.publishedAt
                        ? new Date(menu.publishedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {getActionButton(menu)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
