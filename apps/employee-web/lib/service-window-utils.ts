import { EmployeeMenuDto, EmployeeMenuServiceWindowDto } from '@contracts/core';

/**
 * Returns true if at least one service window is currently open (within its order start and cutoff).
 * Used when a company has multiple services with overlapping availability so the UI shows
 * "open" whenever any service is still orderable. Each service still has its own countdown.
 */
export function isAnyServiceWindowOpen(menu: EmployeeMenuDto, now: Date = new Date()): boolean {
  const windows = menu.serviceWindows;
  if (!windows?.length) return false;
  return windows.some((sw) => {
    const cutoff = new Date(sw.cutoffTime);
    if (now > cutoff) return false;
    const start = sw.orderStartTime ? new Date(sw.orderStartTime) : null;
    if (start && now < start) return false;
    return true;
  });
}

/**
 * Returns the latest cutoff time from all service windows.
 * Used for calculating ready time when multiple services have different cutoffs.
 */
export function getLatestServiceCutoff(menu: EmployeeMenuDto): Date | null {
  const windows = menu.serviceWindows;
  if (!windows?.length) return null;
  
  const cutoffs = windows.map((sw) => new Date(sw.cutoffTime));
  return new Date(Math.max(...cutoffs.map((d) => d.getTime())));
}

/**
 * Returns true if all service windows are past cutoff.
 */
export function areAllServiceWindowsPastCutoff(menu: EmployeeMenuDto, now: Date = new Date()): boolean {
  const windows = menu.serviceWindows;
  if (!windows?.length) return false;
  return windows.every((sw) => now > new Date(sw.cutoffTime));
}
