'use client';

import { useState, ReactNode, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '../logo';
import { useAuth } from '../../contexts/auth-context';
import {
  Calendar,
  Plus,
  CalendarDays,
  History,
  Menu,
  X,
  LogOut,
  Building2,
} from 'lucide-react';

interface ClientSidebarLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Today', href: '/today', icon: Calendar },
  { name: 'New Order', href: '/new-order', icon: Plus },
  { name: 'Order History', href: '/calendar', icon: History },
  { name: 'My Company', href: '/company', icon: Building2 },
];

function NavigationContent({ children }: ClientSidebarLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationWithCurrent = navigation.map((item) => ({
    ...item,
    current: pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href.split('?')[0])),
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
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
                    item.current
                      ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                      : 'text-gray-700 hover:bg-surface-light border-2 border-transparent'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
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
                <p className="text-xs text-gray-500">Employee</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-surface-light transition-colors min-h-[44px]"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-surface border-b border-surface-dark shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-surface-light"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo className="flex-1 justify-center" />
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ClientSidebarLayout({ children }: ClientSidebarLayoutProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NavigationContent>{children}</NavigationContent>
    </Suspense>
  );
}
