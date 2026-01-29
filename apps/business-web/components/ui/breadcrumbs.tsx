'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getBreadcrumbsFromPath, BreadcrumbSegment } from '../../lib/breadcrumb-config';
import { ChevronRight } from 'lucide-react';

const SEGMENT_I18N_KEYS: Record<string, string> = {
  Dashboard: 'navigation.dashboard',
  Employees: 'navigation.employees',
  Services: 'navigation.services',
  Orders: 'navigation.orders',
  Invoices: 'navigation.invoices',
  Login: 'common.labels.login',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const segments = getBreadcrumbsFromPath(pathname);

  if (segments.length === 0) return null;

  const translateLabel = (label: string): string => {
    return SEGMENT_I18N_KEYS[label] ? t(SEGMENT_I18N_KEYS[label]) : label;
  };

  return (
    <nav aria-label="Breadcrumb" className="px-4 sm:px-6 lg:px-8 py-2 border-b border-surface-dark bg-surface/50">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const label = translateLabel(segment.label);
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden />
              )}
              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {label}
                </span>
              ) : segment.href ? (
                <Link
                  href={segment.href}
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {label}
                </Link>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
