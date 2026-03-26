import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LANGUAGES = [
    { code: 'en', native: 'English' },
    { code: 'hi', native: 'हिन्दी' },
    { code: 'ta', native: 'தமிழ்' },
    { code: 'te', native: 'తెలుగు' },
    { code: 'kn', native: 'ಕನ್ನಡ' },
    { code: 'ml', native: 'മലയാളം' },
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSelect(code) {
        i18n.changeLanguage(code);
        setIsOpen(false);
    }

    return (
        <div className="lang-sel-wrap" ref={ref}>
            <button
                className="lang-sel-btn"
                onClick={() => setIsOpen(prev => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                title="Select Language"
            >
                <span className="lang-code">{current.code.toUpperCase()}</span>
                <span className="lang-native">{current.native}</span>
                <span className={`lang-chevron${isOpen ? ' open' : ''}`}>▾</span>
            </button>

            {isOpen && (
                <div className="lang-dropdown" role="listbox">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            role="option"
                            aria-selected={i18n.language === lang.code}
                            className={`lang-opt${i18n.language === lang.code ? ' active' : ''}`}
                            onClick={() => handleSelect(lang.code)}
                        >
                            <span className="lang-native">{lang.native}</span>
                            {i18n.language === lang.code && <span className="lang-tick">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
