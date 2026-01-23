'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export function Error({ 
  message,
  onRetry 
}: { 
  message: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
    >
      <div className="flex items-start">
        <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
        >
          <AlertCircle className="h-5 w-5 text-destructive" />
        </motion.div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-normal text-destructive">{message}</p>
          {onRetry && (
            <motion.button
              onClick={onRetry}
              className="mt-2 text-sm text-destructive hover:text-destructive/80 underline font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try again
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
