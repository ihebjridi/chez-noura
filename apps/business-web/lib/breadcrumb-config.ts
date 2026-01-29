/**
 * Maps path segments to breadcrumb labels for business portal.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  services: 'Services',
  orders: 'Orders',
  invoices: 'Invoices',
  login: 'Login',
};

/** Parent path prefix -> label for dynamic [id] segment */
const DYNAMIC_SEGMENT_LABELS: Record<string, string> = {
  '/invoices': 'Invoice',
};

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

function isLikelyId(segment: string): boolean {
  return segment.length >= 20 || /^[0-9a-f-]{20,}$/i.test(segment);
}

function getDynamicLabel(parentPath: string, _segment: string): string {
  for (const [prefix, label] of Object.entries(DYNAMIC_SEGMENT_LABELS)) {
    if (parentPath === prefix || parentPath.startsWith(prefix + '/')) {
      return label;
    }
  }
  return 'Detail';
}

/**
 * Build breadcrumb segments from pathname.
 * Root '/' is treated as Dashboard.
 */
export function getBreadcrumbsFromPath(pathname: string | null): BreadcrumbSegment[] {
  if (!pathname || pathname === '/') {
    return [{ label: 'Dashboard' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const result: BreadcrumbSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');

    const label =
      SEGMENT_LABELS[segment] ??
      (isLikelyId(segment)
        ? getDynamicLabel(result.length > 0 ? '/' + segments.slice(0, i).join('/') : '', segment)
        : segment);

    const isLast = i === segments.length - 1;
    result.push({
      label,
      ...(isLast ? {} : { href }),
    });
  }

  return result;
}
