import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Cookies from 'js-cookie';
import frTranslation from './locales/fr/translation.json';
import enTranslation from './locales/en/translation.json';

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'fr';
const COOKIE_EXPIRATION_DAYS = 365;

// Always initialize with default locale to prevent hydration mismatch
// The locale will be synced from cookie in I18nProvider after hydration
i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: frTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    lng: DEFAULT_LOCALE, // Always use default for initial render
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

// Function to change language and persist to cookie
export const changeLanguage = (locale: string) => {
  i18n.changeLanguage(locale);
  Cookies.set(LOCALE_COOKIE_NAME, locale, { expires: COOKIE_EXPIRATION_DAYS });
};

export default i18n;
