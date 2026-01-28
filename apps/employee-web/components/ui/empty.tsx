'use client';

import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Empty({ 
  message,
  description 
}: { 
  message?: string;
  description?: string;
}) {
  const { t } = useTranslation();
  const defaultMessage = t('common.labels.noData');
  
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <Inbox className="w-10 h-10 text-secondary-400" />
      </motion.div>
      <motion.p
        className="text-base md:text-lg font-semibold text-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message || defaultMessage}
      </motion.p>
      {description && (
        <motion.p
          className="mt-2 text-xs md:text-sm text-gray-600 text-center max-w-md font-normal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
