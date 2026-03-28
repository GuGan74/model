import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/translate';

// Simple in-memory cache for translations
const translationCache = {};

/**
 * A component that translates its children (text) into the current language
 * selected via react-i18next using Google Translate.
 */
const TranslatedText = ({ children, className = '', style = {} }) => {
    const { i18n } = useTranslation();
    const [translated, setTranslated] = useState(children);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const currentLang = i18n.language;

        // Don't translate if language is English or if it's already translated
        if (!children || currentLang === 'en' || currentLang === 'en-US') {
            setTranslated(children);
            return;
        }

        const cacheKey = `${currentLang}:${children}`;
        if (translationCache[cacheKey]) {
            setTranslated(translationCache[cacheKey]);
            return;
        }

        const performTranslation = async () => {
            setLoading(true);
            try {
                const result = await translateText(children, currentLang);
                if (isMounted) {
                    translationCache[cacheKey] = result;
                    setTranslated(result);
                }
            } catch (error) {
                console.error('Translation component error:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        performTranslation();

        return () => {
            isMounted = false;
        };
    }, [children, i18n.language]);

    return (
        <span 
            className={className} 
            style={{ 
                ...style, 
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s ease-in-out'
            }}
        >
            {translated}
        </span>
    );
};

export default TranslatedText;
