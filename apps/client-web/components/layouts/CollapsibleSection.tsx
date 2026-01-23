'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string | ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  icon?: ReactNode;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  icon,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-surface border border-surface-dark rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-surface-light transition-colors ${headerClassName}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="text-gray-600 flex-shrink-0">{icon}</span>}
          {typeof title === 'string' ? (
            <span className="font-semibold text-gray-900 text-left">{title}</span>
          ) : (
            title
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-surface-dark">
          {children}
        </div>
      )}
    </div>
  );
}
