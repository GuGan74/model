import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './BottomNav.css';

export default function BottomNav() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { isGuest, guestPrefs, listingType, setListingType } = useAuth();

    // Hide the Sell button for buyer-guests (they're browsing, not selling)
    const isBuyer = isGuest && guestPrefs?.role === 'buyer';

    function handleToggleType() {
        const next = listingType === 'livestock' ? 'pets' : 'livestock';
        setListingType(next);
        // Navigate home to instantly see the filtered listings
        navigate('/');
    }

    const toggleIcon = listingType === 'livestock' ? '🐾' : '🐄';
    const toggleLabel = listingType === 'livestock' ? 'Buy Pets' : 'Buy Cattle';

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                <button
                    className={`bnav-btn${pathname === '/' ? ' active' : ''}`}
                    onClick={() => navigate('/')}
                    aria-label="Home"
                >
                    <span className="bnav-icon">🏠</span>
                    <span className="bnav-label">{t('bottomNav.home')}</span>
                </button>

                <button
                    className={`bnav-btn${pathname === '/search' ? ' active' : ''}`}
                    onClick={() => navigate('/search')}
                    aria-label="Search"
                >
                    <span className="bnav-icon">🔍</span>
                    <span className="bnav-label">{t('bottomNav.search')}</span>
                </button>

                {!isBuyer && (
                    <button
                        className="bnav-btn bnav-sell"
                        onClick={() => navigate('/sell')}
                        aria-label="Sell"
                    >
                        <span className="bnav-sell-icon">+</span>
                        <span className="bnav-label">{t('bottomNav.sell')}</span>
                    </button>
                )}

                {/* Cattle / Pets Toggle */}
                <button
                    className="bnav-btn bnav-toggle"
                    onClick={handleToggleType}
                    aria-label={toggleLabel}
                    title={`Switch to ${toggleLabel}`}
                >
                    <span className="bnav-icon">{toggleIcon}</span>
                    <span className="bnav-label" style={{ fontSize: 9 }}>{toggleLabel}</span>
                </button>

                <button
                    className={`bnav-btn${pathname === '/notifications' ? ' active' : ''}`}
                    onClick={() => navigate('/notifications')}
                    aria-label="Alerts"
                >
                    <span className="bnav-icon">🔔</span>
                    <span className="bnav-label">{t('bottomNav.alerts')}</span>
                </button>

                <button
                    className={`bnav-btn${pathname === '/profile' ? ' active' : ''}`}
                    onClick={() => navigate('/profile')}
                    aria-label="Profile"
                >
                    <span className="bnav-icon">👤</span>
                    <span className="bnav-label">{t('bottomNav.profile')}</span>
                </button>
            </div>
        </nav>
    );
}
