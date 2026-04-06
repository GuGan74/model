import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import cowLogo from '../assets/kosalai-logo-removebg-preview.png';
import LanguageSelector from './LanguageSelector';
import './Navbar.css';


export default function Navbar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { currentProfile, signOut, isLoggedIn, listingType, setListingType } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const initials = (currentProfile?.full_name || 'U').slice(0, 2).toUpperCase();

    function handleToggleType() {
        const next = listingType === 'livestock' ? 'pets' : 'livestock';
        setListingType(next);
        navigate('/');
    }

    const toggleIcon = listingType === 'livestock' ? '🐾' : '🐄';
    const toggleLabel = listingType === 'livestock' ? t('nav.buy_pets') : t('nav.buy_cattle');

    const navLinks = [
        { icon: '🏠', label: t('nav.home'), path: '/' },
        { icon: '👤', label: t('nav.profile'), path: '/profile' },
    ];

    async function handleSignOut() {
        await signOut();
        navigate('/');
    }

    return (
        <>
            <nav className="navbar-container">
                <div className="nav-wrapper">
                <div className="nav-inner">
                    <div className="nav-logo" onClick={() => navigate('/')}>
                        <img src={cowLogo} className="nav-logo-icon" alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                        <div className="nav-brand">{t('nav.brand')}</div>
                    </div>

                    {/* Desktop links */}
                    <div className="nav-links hide-mobile">
                        {navLinks.map(l => (
                            <button
                                key={l.path}
                                className={`nav-link${pathname === l.path ? ' active' : ''}`}
                                onClick={() => navigate(l.path)}
                            >
                                <span style={{ marginRight: '6px' }}>{l.icon}</span>
                                {l.label}
                            </button>
                        ))}
                    </div>

                    <div className="nav-right">
                        <button
                            className="hide-mobile"
                            onClick={handleToggleType}
                            style={{
                                background: '#e8f5e9',
                                color: '#1a7a3c',
                                border: '1px solid #1a7a3c',
                                borderRadius: 20,
                                padding: '4px 12px',
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: 'pointer',
                                fontFamily: 'Nunito, sans-serif',
                                marginRight: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                whiteSpace: 'nowrap'
                            }}
                            title={`Switch to ${toggleLabel}`}
                        >
                            <span>{toggleIcon}</span>
                            <span>{toggleLabel}</span>
                        </button>
                        {/* Show avatar for logged-in, Sign In button for guests */}
                        {isLoggedIn ? (
                            <div className="nav-avatar" onClick={() => navigate('/profile')} title={t('navbar.myProfile')}>
                                {initials}
                            </div>
                        ) : (
                            pathname !== '/login' && (
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        background: '#1a7a3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 20,
                                        padding: '8px 18px',
                                        fontWeight: 800,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        fontFamily: 'Nunito, sans-serif',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t('navbar.signIn')}
                                </button>
                            )
                        )}
                        {isLoggedIn && (
                            <button className="btn-sell-nav hide-mobile" onClick={() => navigate('/sell')}>
                                {t('navbar.sellCattle')}
                            </button>
                        )}
                        {/* Hamburger */}
                        <button
                            className="ham-btn hide-tablet-up"
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Open menu"
                        >
                            <span /><span /><span />
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        {/* Mobile Drawer */}
            <div
                className={`mob-overlay${drawerOpen ? ' open' : ''}`}
                onClick={() => setDrawerOpen(false)}
            />
            <div className={`mob-drawer${drawerOpen ? ' open' : ''}`}>
                <div className="mob-drawer-hd">
                    <img src={cowLogo} className="nav-logo-icon" alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                    <div className="nav-brand" style={{ fontSize: 16 }}>{t('nav.brand')}</div>
                    <button className="mob-close-btn" onClick={() => setDrawerOpen(false)}>✕</button>
                </div>
                <div className="mob-drawer-links">
                    {navLinks.map(l => (
                        <button key={l.path} className="mob-dl" onClick={() => { navigate(l.path); setDrawerOpen(false); }}>
                            {l.label}
                        </button>
                    ))}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--g5)', margin: '8px 0' }} />
                    {/* Language selector in drawer */}
                    <div style={{ padding: '4px 14px 8px' }}>
                        <LanguageSelector />
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--g5)', margin: '0 0 8px' }} />
                    <button className="mob-dl" onClick={() => { navigate('/sell'); setDrawerOpen(false); }} style={{ color: 'var(--green)', background: 'var(--green-light)' }}>
                        {t('navbar.postNewListing')}
                    </button>
                    {isLoggedIn ? (
                        <button className="mob-dl" onClick={handleSignOut} style={{ color: 'var(--red)' }}>{t('navbar.signOut')}</button>
                    ) : (
                        <button className="mob-dl" onClick={() => { navigate('/login'); setDrawerOpen(false); }} style={{ color: 'var(--green)', fontWeight: 800 }}>{t('navbar.signInRegister')}</button>
                    )}
                </div>
            </div>
        </>
    );
}
