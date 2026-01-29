'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]',
      secondary:
        'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-blue-300 focus:ring-blue-500 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]',
      ghost:
        'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
