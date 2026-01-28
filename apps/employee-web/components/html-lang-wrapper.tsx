'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function HtmlLangWrapper({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update the html lang attribute when language changes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = i18n.language || 'fr';
    }
  }, [i18n.language]);

  return <>{children}</>;
}
