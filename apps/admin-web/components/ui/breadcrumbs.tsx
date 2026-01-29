'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { getBreadcrumbsFromPath, BreadcrumbSegment } from '../../lib/breadcrumb-config';
import { BreadcrumbContext } from '../../contexts/breadcrumb-context';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbsProps {
  /** Override segments; if not provided, derived from pathname + context */
  segments?: BreadcrumbSegment[];
}

export function Breadcrumbs({ segments: segmentsProp }: BreadcrumbsProps) {
  const pathname = usePathname();
  const ctx = useContext(BreadcrumbContext);
  const segmentLabels = ctx?.segmentLabels;
  const segments =
    segmentsProp ?? getBreadcrumbsFromPath(pathname, segmentLabels);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-4 sm:px-6 lg:px-8 py-2 border-b border-surface-dark bg-surface/50">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden />
              )}
              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {segment.label}
                </span>
              ) : segment.href ? (
                <Link
                  href={segment.href}
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {segment.label}
                </Link>
              ) : (
                <span>{segment.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
