'use client';

import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastItem } from './useToast';

const variantStyles: Record<
  ToastItem['type'],
  { icon: typeof CheckCircle; bg: string; border: string; iconBg: string; text: string }
> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-success-50',
    border: 'border-success-300',
    iconBg: 'bg-success-500',
    text: 'text-success-800',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    iconBg: 'bg-destructive',
    text: 'text-gray-900',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-50',
    border: 'border-warning-300',
    iconBg: 'bg-warning-500',
    text: 'text-warning-900',
  },
  info: {
    icon: Info,
    bg: 'bg-secondary-100',
    border: 'border-secondary-300',
    iconBg: 'bg-secondary-500',
    text: 'text-secondary-900',
  },
};

interface ToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ item, onDismiss }: ToastProps) {
  const style = variantStyles[item.type];
  const Icon = style.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`flex items-center gap-3 rounded-2xl border-2 ${style.border} ${style.bg} p-4 shadow-lg min-h-[56px] max-w-[calc(100vw-2rem)] sm:max-w-md`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${style.iconBg} text-white`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className={`flex-1 text-sm font-medium ${style.text} min-w-0`}>{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-black/5 active:bg-black/10 transition-colors touch-manipulation"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
    </motion.div>
  );
}
