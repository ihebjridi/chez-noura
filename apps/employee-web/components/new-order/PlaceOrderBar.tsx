'use client';

import { useTranslation } from 'react-i18next';
import { OrderReadyTime, type ReadyTimeInfo } from './OrderReadyTime';

interface PlaceOrderBarProps {
  readyTime: ReadyTimeInfo | null;
  locale: string;
  isValid: boolean;
  submitting: boolean;
  onPlaceOrder: () => void;
}

/** Sticky bottom bar with ready time and Place order button. Used by new-order page. */
export function PlaceOrderBar({
  readyTime,
  locale,
  isValid,
  submitting,
  onPlaceOrder,
}: PlaceOrderBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky bottom-0 z-50 bg-white/50 backdrop-blur-xl border-t border-primary-600/30 shadow-lg rounded-t-xl mt-4 mb-16 lg:mb-0">
      <div className="px-3 py-2">
        {readyTime && (
          <OrderReadyTime readyTime={readyTime} locale={locale} />
        )}
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={!isValid || submitting}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-base rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
        >
          {submitting
            ? t('newOrder.placingOrder')
            : !isValid
              ? t('common.labels.completeSelection')
              : t('common.buttons.placeOrder')}
        </button>
      </div>
    </div>
  );
}
