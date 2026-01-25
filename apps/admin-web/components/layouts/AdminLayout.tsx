'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '../logo';
import { useAuth } from '../../contexts/auth-context';
import {
  Building2,
  Package,
  Calendar,
  ShoppingCart,
  ChefHat,
  FileText,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: false },
  { name: 'Menus', href: '/', icon: Calendar, current: false },
  { name: 'Businesses', href: '/businesses', icon: Building2, current: false },
  { name: 'Packs', href: '/packs', icon: Package, current: false },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, current: false },
  { name: 'Kitchen', href: '/kitchen', icon: ChefHat, current: false },
  { name: 'Invoices', href: '/invoices', icon: FileText, current: false },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationWithCurrent = navigation.map((item) => ({
    ...item,
    current: pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)),
  }));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-surface-dark transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-surface-dark">
            <Logo />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-surface-light"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationWithCurrent.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                      : 'text-gray-700 hover:bg-surface-light border-2 border-transparent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-surface-dark">
            <div className="flex items-center gap-3 mb-3 px-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-surface-light transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-surface border-b border-surface-dark shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-surface-light"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationWithCurrent.find((item) => item.current)?.name || 'Admin'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">{children}</div>
        </main>

        {/* Footer */}
        <footer className="bg-surface border-t border-surface-dark py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Chez Noura. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">Super Admin Portal</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
