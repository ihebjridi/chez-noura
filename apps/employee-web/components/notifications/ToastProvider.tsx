'use client';

import { useCallback, useState, ReactNode } from 'react';
import { ToastContext } from './useToast';
import { ToastContainer } from './ToastContainer';
import type { ToastItem, ShowToastOptions } from './useToast';

const TOAST_DURATION_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type, message }: ShowToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: ToastItem = { id, type, message, createdAt: Date.now() };
    setToasts((prev) => [...prev.slice(-2), item]);
    setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}
