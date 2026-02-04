'use client';

import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { CollapsibleSection } from '../layouts/CollapsibleSection';
import { getImageSrc } from '../../lib/utils';
import type { AvailableComponentDto } from '@contracts/core';

const API_BASE = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' : '';

interface ComponentVariantPickerProps {
  component: AvailableComponentDto;
  selectedVariantId: string | undefined;
  onSelectVariant: (componentId: string, variantId: string) => void;
}

/** Single component block: title, required/optional, list of variant options. Used by new-order page. */
export function ComponentVariantPicker({
  component,
  selectedVariantId,
  onSelectVariant,
}: ComponentVariantPickerProps) {
  const { t } = useTranslation();
  const hasSelection = !!selectedVariantId;
  const isValid = !component.required || hasSelection;

  return (
    <CollapsibleSection
      title={
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{component.name}</span>
          {component.required && (
            <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full border border-destructive/20">
              {t('common.labels.required')}
            </span>
          )}
          {!component.required && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {t('common.labels.optional')}
            </span>
          )}
        </div>
      }
      defaultOpen={!hasSelection}
      headerClassName={`${!isValid ? 'border-l-4 border-destructive' : ''} py-3`}
      icon={
        hasSelection ? (
          <CheckCircle className="w-5 h-5 text-success-600" />
        ) : component.required ? (
          <AlertCircle className="w-5 h-5 text-destructive" />
        ) : null
      }
    >
      <div className="space-y-2 pt-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          {t('menu.selectVariant')} {component.name}:
        </p>
        {component.variants.map((variant) => {
          const isOutOfStock = variant.stockQuantity <= 0;
          const isInactive = !variant.isActive;
          const isDisabled = isOutOfStock || isInactive;
          const isSelected = selectedVariantId === variant.id;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => !isDisabled && onSelectVariant(component.id, variant.id)}
              disabled={isDisabled}
              className={`relative z-10 w-full text-left p-3 rounded-xl transition-all duration-200 min-h-[64px] ${
                isSelected
                  ? 'border-[2px] border-primary-600 bg-primary-50 shadow-md scale-[1.01]'
                  : 'border border-gray-200 hover:border-primary-400 hover:bg-gray-50 hover:shadow-sm'
              } ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                {variant.imageUrl ? (
                  <img
                    src={getImageSrc(variant.imageUrl, API_BASE)}
                    alt={variant.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    {t('common.labels.noImage')}
                  </div>
                )}
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block text-sm ${
                        isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                      }`}
                    >
                      {variant.name}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-primary-600 font-medium mt-0.5 block">
                        {t('common.labels.selected')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {isOutOfStock && (
                      <span className="px-1.5 py-0.5 text-xs text-destructive font-medium bg-destructive/10 rounded border border-destructive/20">
                        {t('common.labels.outOfStock')}
                      </span>
                    )}
                    {!isOutOfStock && variant.stockQuantity < 10 && (
                      <span className="px-1.5 py-0.5 text-xs text-warning-700 font-medium bg-warning-50 rounded border border-warning-200">
                        {variant.stockQuantity} {t('common.labels.left')}
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {component.required && !selectedVariantId && (
        <p className="text-sm text-destructive mt-3 font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-2">
          ⚠️ {t('common.labels.required')} - {t('menu.selectVariant')} {component.name}
        </p>
      )}
    </CollapsibleSection>
  );
}
