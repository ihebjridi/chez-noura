'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  helpText,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('w-full', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500 font-normal">{helpText}</p>
      )}
    </div>
  );
}
