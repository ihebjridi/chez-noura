'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import './config';

interface I18nProviderProps {
  children: React.ReactNode;
}

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Sync locale from cookie on mount
    const storedLocale = Cookies.get(LOCALE_COOKIE_NAME);
    if (storedLocale && (storedLocale === 'fr' || storedLocale === 'en')) {
      if (i18n.language !== storedLocale) {
        i18n.changeLanguage(storedLocale);
      }
    }
  }, [i18n]);

  return <>{children}</>;
}
