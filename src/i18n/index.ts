import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪', dir: 'rtl' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const lang = languages.find(l => l.code === lng);
  document.documentElement.dir = lang?.dir || 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
