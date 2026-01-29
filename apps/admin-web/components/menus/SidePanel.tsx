'use client';

import { useState } from 'react';
import { ServiceDto, VariantDto } from '@contracts/core';
import { X, Settings, Package, ChevronDown, ChevronUp } from 'lucide-react';

interface SidePanelProps {
  isOpen: boolean;
  section: 'services' | 'variants' | null;
  allServices: ServiceDto[];
  onClose: () => void;
  onSectionChange: (section: 'services' | 'variants' | null) => void;
  onServiceClick?: (serviceId: string) => void;
}

export function SidePanel({
  isOpen,
  section,
  allServices,
  onClose,
  onSectionChange,
  onServiceClick,
}: SidePanelProps) {
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set());

  if (!isOpen) {
    return null;
  }

  const toggleService = (serviceId: string) => {
    setExpandedServiceIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

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
            onClick={() => onSectionChange(section === 'services' ? null : 'services')}
            className={`w-full px-4 py-2 text-left rounded-lg font-medium transition-colors ${
              section === 'services'
                ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
            }`}
          >
            Service Library
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

        {section === 'services' && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">All Services</h3>
            {allServices.length === 0 ? (
              <p className="text-sm text-gray-600 font-normal">No services available</p>
            ) : (
              <div className="space-y-2">
                {allServices.map((service) => {
                  const isExpanded = expandedServiceIds.has(service.id);
                  return (
                    <div
                      key={service.id}
                      className="border border-surface-dark rounded-lg overflow-hidden"
                    >
                      <div
                        onClick={() => {
                          toggleService(service.id);
                          onServiceClick?.(service.id);
                        }}
                        className="p-3 hover:bg-surface-light cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Settings className="h-4 w-4 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{service.name}</div>
                              {service.description && (
                                <div className="text-xs text-gray-600 mt-1">{service.description}</div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Order start: {service.orderStartTime || '—'} · Cutoff: {service.cutoffTime || '—'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleService(service.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-surface-dark bg-surface-light">
                          <p className="text-xs text-gray-500 mt-2 mb-2">Packs in this service:</p>
                          <p className="text-sm text-gray-600 font-normal">
                            Click on the service in the main view to see pack details
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
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
