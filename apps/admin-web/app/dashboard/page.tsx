'use client';

import Link from 'next/link';
import { ProtectedRoute } from '../../components/protected-route';
import { UserRole } from '@contracts/core';
import { Logo } from '../../components/logo';
import { useAuth } from '../../contexts/auth-context';

export default function DashboardPage() {
  const { logout, user } = useAuth();

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Logo />
              <div className="flex items-center gap-4">
                {user && (
                  <span className="text-sm text-gray-600">{user.email}</span>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage businesses, meals, orders, and operations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/businesses"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Businesses</h2>
              </div>
              <p className="text-gray-600">Manage businesses and their admins</p>
            </Link>

            <Link
              href="/packs"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Packs</h2>
              </div>
              <p className="text-gray-600">Manage Iftar packs and pricing</p>
            </Link>

            <Link
              href="/food-components"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Food Components</h2>
              </div>
              <p className="text-gray-600">Manage food components and variants</p>
            </Link>

            <Link
              href="/daily-menus"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Daily Menus</h2>
              </div>
              <p className="text-gray-600">Publish daily menus and manage stock</p>
            </Link>

            <Link
              href="/orders"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
              </div>
              <p className="text-gray-600">View all orders</p>
            </Link>

            <Link
              href="/kitchen"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Kitchen Operations</h2>
              </div>
              <p className="text-gray-600">Daily summaries and day locking</p>
            </Link>

            <Link
              href="/invoices"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
              </div>
              <p className="text-gray-600">Manage invoices and billing</p>
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
