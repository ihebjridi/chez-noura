'use client';

import { ReactNode } from 'react';

interface SplitPaneProps {
  left: ReactNode;
  right?: ReactNode;
  leftClassName?: string;
  rightClassName?: string;
  className?: string;
}

export function SplitPane({
  left,
  right,
  leftClassName = '',
  rightClassName = '',
  className = '',
}: SplitPaneProps) {
  return (
    <div className={`flex flex-col lg:flex-row gap-4 lg:gap-6 ${className}`}>
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 ${leftClassName}`}>
        {left}
      </div>

      {/* Side Panel */}
      {right && (
        <div className={`w-full lg:w-80 xl:w-96 flex-shrink-0 ${rightClassName}`}>
          {right}
        </div>
      )}
    </div>
  );
}
