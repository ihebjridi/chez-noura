'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useContext } from 'react';
import { ToastContext } from './useToast';
import { Toast } from './Toast';

export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismissToast } = ctx;

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-[1000] flex flex-col items-center gap-2 px-4 pb-2 pointer-events-none lg:bottom-6"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}
    >
      <div className="flex flex-col-reverse items-center gap-2 w-full max-w-md pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <Toast key={item.id} item={item} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
