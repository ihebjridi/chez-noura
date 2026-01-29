/**
 * Maps path segments to i18n translation keys for business portal.
 */
const SEGMENT_I18N_KEYS: Record<string, string> = {
  dashboard: 'navigation.dashboard',
  employees: 'navigation.employees',
  services: 'navigation.services',
  orders: 'navigation.orders',
  invoices: 'navigation.invoices',
  login: 'common.buttons.login',
};

/** Parent path prefix -> i18n key for dynamic [id] segment */
const DYNAMIC_SEGMENT_I18N_KEYS: Record<string, string> = {
  '/invoices': 'invoices.invoiceNumber',
};

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

function isLikelyId(segment: string): boolean {
  return segment.length >= 20 || /^[0-9a-f-]{20,}$/i.test(segment);
}

function getDynamicLabel(parentPath: string, _segment: string): string {
  for (const [prefix, i18nKey] of Object.entries(DYNAMIC_SEGMENT_I18N_KEYS)) {
    if (parentPath === prefix || parentPath.startsWith(prefix + '/')) {
      return i18nKey;
    }
  }
  // Return a generic i18n key for detail pages
  return 'common.buttons.view';
}

/**
 * Build breadcrumb segments from pathname.
 * Root '/' is treated as Dashboard.
 * Returns i18n keys as labels, which should be translated in the component.
 */
export function getBreadcrumbsFromPath(pathname: string | null): BreadcrumbSegment[] {
  if (!pathname || pathname === '/') {
    return [{ label: 'navigation.dashboard' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const result: BreadcrumbSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');

    const label =
      SEGMENT_I18N_KEYS[segment] ??
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
