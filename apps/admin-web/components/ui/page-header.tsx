'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className={action ? 'flex justify-between items-start mb-6' : 'mb-6'}>
      <div>
        <h1 className="text-2xl font-semibold text-secondary-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-secondary-600 font-normal">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
