/**
 * Maps path segments to breadcrumb labels.
 * Dynamic [id] segments get a fallback based on parent path.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  businesses: 'Businesses',
  packs: 'Packs',
  'food-components': 'Components',
  components: 'Components',
  variants: 'Variants',
  services: 'Services',
  orders: 'Orders',
  kitchen: 'Kitchen',
  invoices: 'Invoices',
  menus: 'Menus',
  'daily-menus': 'Daily menus',
};

/** Parent path prefix -> label for dynamic [id] segment */
const DYNAMIC_SEGMENT_LABELS: Record<string, string> = {
  '/packs': 'Pack',
  '/food-components': 'Component',
  '/businesses': 'Business',
  '/menus': 'Menu',
  '/daily-menus': 'Daily menu',
};

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

/**
 * Build breadcrumb segments from pathname.
 * Root '/' is treated as Dashboard.
 * @param pathname - Current pathname
 * @param segmentLabelOverrides - Optional map of segment value -> label (e.g. entity id -> entity name)
 */
export function getBreadcrumbsFromPath(
  pathname: string | null,
  segmentLabelOverrides?: Map<string, string> | Record<string, string>,
): BreadcrumbSegment[] {
  if (!pathname || pathname === '/') {
    return [{ label: 'Dashboard' }];
  }

  const overrides = segmentLabelOverrides instanceof Map
    ? segmentLabelOverrides
    : segmentLabelOverrides
      ? new Map(Object.entries(segmentLabelOverrides))
      : undefined;

  const segments = pathname.split('/').filter(Boolean);
  const result: BreadcrumbSegment[] = [{ label: 'Dashboard', href: '/dashboard' }];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');
    const parentPath = i > 0 ? '/' + segments.slice(0, i).join('/') : '';

    const overrideLabel = overrides?.get(segment);
    const label =
      overrideLabel ??
      SEGMENT_LABELS[segment] ??
      (isLikelyId(segment)
        ? getDynamicLabel(parentPath, segment)
        : segment);

    const isLast = i === segments.length - 1;
    result.push({
      label,
      ...(isLast ? {} : { href }),
    });
  }

  return result;
}

export function isLikelyId(segment: string): boolean {
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
