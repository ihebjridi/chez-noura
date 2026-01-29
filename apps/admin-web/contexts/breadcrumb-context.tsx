'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface BreadcrumbContextValue {
  /** Map of path segment value (e.g. entity id) -> display label (e.g. entity name) */
  segmentLabels: Map<string, string>;
  /** Set the label for a dynamic segment (e.g. setSegmentLabel(packId, pack.name)) */
  setSegmentLabel: (segmentValue: string, label: string) => void;
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [segmentLabels, setSegmentLabels] = useState<Map<string, string>>(new Map());

  // Clear labels when route changes so the new page can set its own
  useEffect(() => {
    setSegmentLabels(new Map());
  }, [pathname]);

  const setSegmentLabel = useCallback((segmentValue: string, label: string) => {
    setSegmentLabels((prev) => {
      const next = new Map(prev);
      next.set(segmentValue, label);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ segmentLabels, setSegmentLabel }),
    [segmentLabels, setSegmentLabel],
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbSegment(segmentValue: string | undefined, label: string | undefined) {
  const ctx = useContext(BreadcrumbContext);
  const setSegmentLabel = ctx?.setSegmentLabel;
  useEffect(() => {
    if (setSegmentLabel && segmentValue != null && label != null) {
      setSegmentLabel(segmentValue, label);
    }
  }, [setSegmentLabel, segmentValue, label]);
}
