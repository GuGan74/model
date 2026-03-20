import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import cowLogo from '../assets/kosalai-logo-removebg-preview.png';
import { FEATURES } from '../App';
import './Navbar.css';


export default function Navbar() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentProfile, signOut, isLoggedIn } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const initials = (currentProfile?.full_name || 'U').slice(0, 2).toUpperCase();

    const navLinks = [
        { label: t('navbar.buyCattle'), path: '/' },
        ...(FEATURES.PRICE_TRENDS ? [{ label: t('navbar.priceTrends'), path: '/price-trends' }] : []),
        { label: t('navbar.alerts'), path: '/notifications' },
        { label: t('navbar.profile'), path: '/profile' },
    ];

    async function handleSignOut() {
        await signOut();
        toast.success('Signed out. See you soon! 👋');
        setDrawerOpen(false);
    }

    return (
        <>
            <nav className="navbar">
                <div className="nav-inner">
                    <div className="nav-logo" onClick={() => navigate('/')}>
                        <img src={cowLogo} className="nav-logo-icon" alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                        <div className="nav-brand">Ko<span>salai</span></div>
                    </div>

                    {/* Desktop links */}
                    <div className="nav-links hide-mobile">
                        {navLinks.map(l => (
                            <button
                                key={l.path}
                                className={`nav-link${location.pathname === l.path ? ' active' : ''}`}
                                onClick={() => navigate(l.path)}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>

                    <div className="nav-right">
                        <button
                            className="lang-sel hide-mobile"
                            onClick={() => {
                                const nextLang = i18n.language === 'en' ? 'hi' : (i18n.language === 'hi' ? 'ta' : 'en');
                                i18n.changeLanguage(nextLang);
                            }}
                            style={{ background: 'white', color: 'var(--g1)', border: '2px solid var(--g5)', borderRadius: 20, padding: '4px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                        >
                            {i18n.language === 'hi' ? 'हिंदी' : (i18n.language === 'ta' ? 'தமிழ்' : 'English')}
                        </button>
                        {/* Show avatar for logged-in, Sign In button for guests */}
                        {isLoggedIn ? (
                            <div className="nav-avatar" onClick={() => navigate('/profile')} title={t('navbar.myProfile')}>
                                {initials}
                            </div>
                        ) : (
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
            </nav>

            {/* Mobile Drawer */}
            <div
                className={`mob-overlay${drawerOpen ? ' open' : ''}`}
                onClick={() => setDrawerOpen(false)}
            />
            <div className={`mob-drawer${drawerOpen ? ' open' : ''}`}>
                <div className="mob-drawer-hd">
                    <img src={cowLogo} className="nav-logo-icon" alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                    <div className="nav-brand" style={{ fontSize: 16 }}>Ko<span>salai</span></div>
                    <button className="mob-close-btn" onClick={() => setDrawerOpen(false)}>✕</button>
                </div>
                <div className="mob-drawer-links">
                    {navLinks.map(l => (
                        <button key={l.path} className="mob-dl" onClick={() => { navigate(l.path); setDrawerOpen(false); }}>
                            {l.label}
                        </button>
                    ))}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--g5)', margin: '8px 0' }} />
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
