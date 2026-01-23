'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/api-client';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import {
  Building2,
  Package,
  ShoppingCart,
  FileText,
  Calendar,
  ChefHat,
  TrendingUp,
  Users,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  totalBusinesses: number;
  totalPacks: number;
  todayOrders: number;
  totalInvoices: number;
  todayRevenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError('');
      setLoading(true);

      const [businesses, packs, orders, invoices] = await Promise.all([
        apiClient.getBusinesses(),
        apiClient.getPacks(),
        apiClient.getAdminOrders(),
        apiClient.getAdminInvoices(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(
        (order) => order.createdAt?.split('T')[0] === today
      );

      // Calculate today's revenue from today's orders
      const todayRevenue = todayOrders.reduce((sum, order) => {
        return sum + (order.totalAmount || 0);
      }, 0);

      setStats({
        totalBusinesses: businesses.length,
        totalPacks: packs.length,
        todayOrders: todayOrders.length,
        totalInvoices: invoices.length,
        todayRevenue,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Daily Menu',
      description: 'Set up today\'s menu and manage stock',
      href: '/',
      icon: Calendar,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      title: 'Add New Business',
      description: 'Register a new business client',
      href: '/businesses',
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Create Pack',
      description: 'Add a new Iftar pack to the catalog',
      href: '/packs',
      icon: Package,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'View Orders',
      description: 'Monitor today\'s orders and status',
      href: '/orders',
      icon: ShoppingCart,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Kitchen Summary',
      description: 'View kitchen operations and summaries',
      href: '/kitchen',
      icon: ChefHat,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Manage Invoices',
      description: 'Generate and view invoices',
      href: '/invoices',
      icon: FileText,
      color: 'bg-slate-100 text-slate-600',
    },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Loading message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your platform operations</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <Error message={error} onRetry={loadStats} />
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Businesses</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.totalBusinesses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Packs</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.totalPacks}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{stats.todayOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.todayRevenue.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'TND',
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group block p-6 bg-surface border border-surface-dark rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Total Invoices</h3>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalInvoices}</p>
            <Link
              href="/invoices"
              className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all invoices
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Active Businesses</h3>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalBusinesses}</p>
            <Link
              href="/businesses"
              className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Manage businesses
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
