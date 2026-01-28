'use client';

import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n/config';
import { Globe } from 'lucide-react';
import { useState } from 'react';

interface LanguageSwitcherProps {
  /** If true, dropdown opens upward (for bottom-positioned switchers) */
  openUpward?: boolean;
}

export function LanguageSwitcher({ openUpward = false }: LanguageSwitcherProps = {}) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = i18n.language || 'fr';
  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
    // Force a page refresh to update all translations
    window.location.reload();
  };

  const currentLang = languages.find((lang) => lang.code === currentLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 hover:bg-surface-light rounded-md transition-colors min-h-[44px] min-w-[44px] justify-center"
        aria-label={t('common.labels.changeLanguage')}
        title={t('common.labels.changeLanguage')}
      >
        <Globe className="w-5 h-5 flex-shrink-0" />
        <span className="hidden sm:inline">{currentLang.flag}</span>
        <span className="hidden md:inline">{currentLang.name}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 w-48 bg-surface border border-surface-dark rounded-lg shadow-lg z-20 ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}>
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-surface-light transition-colors ${
                    currentLanguage === lang.code
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <span className="ml-auto text-primary-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
