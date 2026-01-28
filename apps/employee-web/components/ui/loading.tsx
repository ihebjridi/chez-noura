'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function Loading({ message }: { message?: string }) {
  const { t } = useTranslation();
  const defaultMessage = t('common.messages.loading');
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        className="relative w-12 h-12"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full"></div>
      </motion.div>
      <motion.p
        className="mt-4 text-gray-600 text-sm font-normal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message || defaultMessage}
      </motion.p>
    </div>
  );
}
