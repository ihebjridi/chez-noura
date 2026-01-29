'use client';

import { ServiceDto, ServiceWithPacksDto, VariantDto, DailyMenuServiceDto } from '@contracts/core';
import { ToggleSwitch } from '../../app/daily-menus/[id]/components/ToggleSwitch';
import { ServiceVariantsManager } from './ServiceVariantsManager';
// import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 
import { Settings, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface ServiceSelectionProps {
  services: ServiceDto[];
  selectedServiceIds: Set<string>;
  expandedServices: Set<string>;
  serviceDetails: Map<string, ServiceWithPacksDto>;
  menuServices: DailyMenuServiceDto[];
  foodComponentVariants: Map<string, VariantDto[]>;
  selectedVariants: Set<string>;
  variantStocks: Map<string, number>;
  existingVariantStocks: Map<string, number>;
  updatingVariants: Set<string>;
  isLocked: boolean;
  isExpanded: boolean;
  onToggleSection: () => void;
  onServiceToggle: (serviceId: string, checked: boolean) => void;
  onToggleServiceVariants: (serviceId: string) => void;
  onVariantToggle: (serviceId: string, variantId: string, checked: boolean, componentId: string) => void;
  onStockChange: (serviceId: string, variantId: string, stock: number, isExisting: boolean) => void;
}

export function ServiceSelection({
  services,
  selectedServiceIds,
  expandedServices,
  serviceDetails,
  menuServices,
  foodComponentVariants,
  selectedVariants,
  variantStocks,
  existingVariantStocks,
  updatingVariants,
  isLocked,
  isExpanded,
  onToggleSection,
  onServiceToggle,
  onToggleServiceVariants,
  onVariantToggle,
  onStockChange,
}: ServiceSelectionProps) {
  const getMenuService = (serviceId: string): DailyMenuServiceDto | undefined => {
    return menuServices.find((ms) => ms.serviceId === serviceId);
  };


  return (
    <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
      <button
        onClick={onToggleSection}
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-surface-light transition-colors"
      >
        <h2 className="text-xl font-semibold">Service Selection</h2>
        <span className="text-gray-500">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="px-6 py-4 border-t border-surface-dark">
          {services.length === 0 ? (
            <p className="text-gray-600 font-normal">No services available</p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => {
                const selected = selectedServiceIds.has(service.id);
                const menuService = getMenuService(service.id);
                const isServiceExpanded = expandedServices.has(service.id);

                return (
                  <div key={service.id} className="border border-surface-dark rounded-lg">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                        selected
                          ? 'bg-warning-50 border-warning-300'
                          : 'bg-surface border-surface-dark hover:bg-surface-light'
                      } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <ToggleSwitch
                        checked={selected}
                        onChange={(checked) => onServiceToggle(service.id, checked)}
                        disabled={isLocked}
                        color="primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-gray-400" />
                          <div className="font-medium">{service.name}</div>
                        </div>
                        {service.description && (
                          <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                        )}
                        <div className="text-sm text-gray-500 mt-1">
                          Order start: {service.orderStartTime || '—'} · Cutoff: {service.cutoffTime || '—'}
                        </div>
                        {menuService && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <Package className="h-4 w-4" />
                            <span>{menuService.packs.length} pack{menuService.packs.length !== 1 ? 's' : ''}</span>
                            {menuService.variants.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{menuService.variants.length} variant{menuService.variants.length !== 1 ? 's' : ''} activated</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                    {selected && (
                      <div className="px-4 pb-4">
                        <Accordion type="single" collapsible value={isServiceExpanded ? service.id : undefined}>
                          <AccordionItem value={service.id}>
                            <AccordionTrigger onClick={() => onToggleServiceVariants(service.id)}>
                              <span className="text-sm font-medium">Manage Variants</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              {menuService && (
                                <ServiceVariantsManager
                                  serviceId={service.id}
                                  serviceName={service.name}
                                  servicePacks={menuService.packs}
                                  serviceDetails={serviceDetails.get(service.id)}
                                  foodComponentVariants={foodComponentVariants}
                                  selectedVariants={selectedVariants}
                                  variantStocks={variantStocks}
                                  existingVariantStocks={existingVariantStocks}
                                  updatingVariants={updatingVariants}
                                  isLocked={isLocked}
                                  onVariantToggle={(variantId, checked, componentId) =>
                                    onVariantToggle(service.id, variantId, checked, componentId)
                                  }
                                  onStockChange={(variantId, stock, isExisting) =>
                                    onStockChange(service.id, variantId, stock, isExisting)
                                  }
                                />
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
