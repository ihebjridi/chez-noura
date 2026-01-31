import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolve image URL: use as-is if absolute (R2), else prepend API base (legacy /uploads/). */
export function getImageSrc(
  url: string | undefined | null,
  apiBaseUrl: string,
): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${apiBaseUrl}${url}`;
}
