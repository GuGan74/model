import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './BottomNav.css';

const NAV_ITEMS = [
    { icon: '🏠', labelKey: 'bottomNav.home', path: '/' },
    { icon: '🔍', labelKey: 'bottomNav.search', path: '/search' },
    { icon: '+', labelKey: 'bottomNav.sell', path: '/sell', isSell: true },
    { icon: '🔔', labelKey: 'bottomNav.alerts', path: '/notifications' },
    { icon: '👤', labelKey: 'bottomNav.profile', path: '/profile' },
];

export default function BottomNav() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { isGuest, guestPrefs } = useAuth();

    // Hide the Sell button for buyer-guests (they're browsing, not selling)
    const isBuyer = isGuest && guestPrefs?.role === 'buyer';

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                {NAV_ITEMS.map(item => {
                    // Hide Sell nav item for buyers
                    if (item.isSell && isBuyer) return null;
                    return (
                        <button
                            key={item.path}
                            className={`bnav-btn${pathname === item.path && !item.isSell ? ' active' : ''}${item.isSell ? ' bnav-sell' : ''}`}
                            onClick={() => navigate(item.path)}
                            aria-label={item.label}
                            aria-current={pathname === item.path && !item.isSell ? 'page' : undefined}
                        >
                            {item.isSell ? (
                                <span className="bnav-sell-icon">+</span>
                            ) : (
                                <span className="bnav-icon">{item.icon}</span>
                            )}
                            <span className="bnav-label">{t(item.labelKey)}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
