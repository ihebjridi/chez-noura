'use client';

import { useState } from 'react';
import { PackDto, VariantDto } from '@contracts/core';
import { Accordion, AccordionItem, AccordionHeader, AccordionPanel } from '../../components/ui-layouts/accordion';
import { X } from 'lucide-react';

interface SidePanelProps {
  isOpen: boolean;
  section: 'packs' | 'variants' | null;
  allPacks: PackDto[];
  onClose: () => void;
  onSectionChange: (section: 'packs' | 'variants' | null) => void;
  onPackClick?: (packId: string) => void;
}

export function SidePanel({
  isOpen,
  section,
  allPacks,
  onClose,
  onSectionChange,
  onPackClick,
}: SidePanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-full lg:w-80 xl:w-96 border-l border-surface-dark bg-surface flex flex-col h-full lg:h-auto lg:min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-dark">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-surface-light transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2 mb-4">
          <button
            onClick={() => onSectionChange(section === 'packs' ? null : 'packs')}
            className={`w-full px-4 py-2 text-left rounded-lg font-medium transition-colors ${
              section === 'packs'
                ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
            }`}
          >
            Pack Library
          </button>
          <button
            onClick={() => onSectionChange(section === 'variants' ? null : 'variants')}
            className={`w-full px-4 py-2 text-left rounded-lg font-medium transition-colors ${
              section === 'variants'
                ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
            }`}
          >
            Variant Overview
          </button>
        </div>

        {section === 'packs' && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">All Packs</h3>
            {allPacks.length === 0 ? (
              <p className="text-sm text-gray-600 font-normal">No packs available</p>
            ) : (
              <div className="space-y-2">
                {allPacks.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => onPackClick?.(pack.id)}
                    className="p-3 border border-surface-dark rounded-lg hover:bg-surface-light cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-gray-900">{pack.name}</div>
                    <div className="text-sm text-gray-600 mt-1 font-normal">
                      {pack.price.toFixed(2)} TND
                      {!pack.isActive && (
                        <span className="ml-2 text-xs text-gray-600">(Inactive)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'variants' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Variant Stock Overview</h3>
            <p className="text-sm text-gray-600 font-normal">
              Variant stock information will be displayed here when a daily menu is selected.
            </p>
          </div>
        )}

        {!section && (
          <div className="text-center py-8 text-gray-600">
            <p className="text-sm font-normal">Select a section to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
