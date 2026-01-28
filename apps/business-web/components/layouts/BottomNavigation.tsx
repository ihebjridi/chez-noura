'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, ShoppingCart, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.employees'), href: '/employees', icon: Users },
    { name: t('navigation.orders'), href: '/orders', icon: ShoppingCart },
    { name: t('navigation.invoices'), href: '/invoices', icon: FileText },
  ];

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname?.startsWith(href.split('?')[0]));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 lg:hidden">
      <div className="grid grid-cols-4 h-16">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                active
                  ? 'text-primary-600'
                  : 'text-gray-500'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center',
                active && 'transform scale-110'
              )}>
                <Icon className={cn(
                  'w-6 h-6 transition-all duration-200',
                  active && 'text-primary-600'
                )} />
                {active && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600" />
                )}
              </div>
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                active ? 'text-primary-600' : 'text-gray-500'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
