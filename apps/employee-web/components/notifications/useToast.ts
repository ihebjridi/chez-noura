'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

export interface ShowToastOptions {
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: ShowToastOptions) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
