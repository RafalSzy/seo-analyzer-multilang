import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources.  Vite allows importing JSON files
// directly, so we locate our translations in the src/locales folder.
import enTranslation from './locales/en/translation.json';
import plTranslation from './locales/pl/translation.json';

// Initialise i18next with language detection and the React binding.  The
// resources object contains translations for each supported language.  We
// disable escaping since React already handles escaping properly.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      pl: { translation: plTranslation },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Order and from where user language should be detected
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
