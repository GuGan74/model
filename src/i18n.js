import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import taTranslation from './locales/ta/translation.json';
import teTranslation from './locales/te/translation.json';
import knTranslation from './locales/kn/translation.json';
import mlTranslation from './locales/ml/translation.json';

const STORAGE_KEY = 'kosalai_language';

const resources = {
    en: { translation: enTranslation },
    hi: { translation: hiTranslation },
    ta: { translation: taTranslation },
    te: { translation: teTranslation },
    kn: { translation: knTranslation },
    ml: { translation: mlTranslation },
};

const savedLang = localStorage.getItem(STORAGE_KEY) || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLang,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

// Save selected language and update html lang attribute
i18n.on('languageChanged', (lng) => {
    localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
});

export default i18n;
