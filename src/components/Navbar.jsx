import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import cowLogo from '../assets/istockphoto.webp';
import './Navbar.css';

const LANGUAGES = ['English', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ', 'हिंदी', 'മലയാളം'];

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentProfile, signOut, isLoggedIn } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const initials = (currentProfile?.full_name || 'U').slice(0, 2).toUpperCase();

    const navLinks = [
        { label: '🛒 Buy Cattle', path: '/' },
        { label: '📊 Price Trends', path: '/price-trends' },
        { label: '🔔 Alerts', path: '/notifications' },
        { label: '👤 Profile', path: '/profile' },
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
                        <img src={cowLogo} className="nav-logo-icon" alt="Logo" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%' }} />
                        <div className="nav-brand">Pashu<span>Bazaar</span></div>
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
                        <select className="lang-sel hide-mobile">
                            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                        </select>
                        {/* Show avatar for logged-in, Sign In button for guests */}
                        {isLoggedIn ? (
                            <div className="nav-avatar" onClick={() => navigate('/profile')} title="My Profile">
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
                                Sign In
                            </button>
                        )}
                        {isLoggedIn && (
                            <button className="btn-sell-nav hide-mobile" onClick={() => navigate('/sell')}>
                                + Sell Cattle
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
                    <img src={cowLogo} className="nav-logo-icon" alt="Logo" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%' }} />
                    <div className="nav-brand" style={{ fontSize: 16 }}>Pashu<span>Bazaar</span></div>
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
                        + Post New Listing
                    </button>
                    {isLoggedIn ? (
                        <button className="mob-dl" onClick={handleSignOut} style={{ color: 'var(--red)' }}>🚪 Sign Out</button>
                    ) : (
                        <button className="mob-dl" onClick={() => { navigate('/login'); setDrawerOpen(false); }} style={{ color: 'var(--green)', fontWeight: 800 }}>🔑 Sign In / Register</button>
                    )}
                </div>
            </div>
        </>
    );
}
