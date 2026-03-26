import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import logoImg from '../assets/kosalai-logo-removebg-preview.png';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { enterGuestMode } = useAuth();
    const { t } = useTranslation();

    function go(role, category) {
        try {
            localStorage.setItem('pb_guest', 'true');
            localStorage.setItem('pb_guest_prefs',
                JSON.stringify({ role, category }));
        } catch (err) {
            console.error('Failed to set guest preference', err);
        }
        enterGuestMode({ role, category });

        // Sellers go directly to sell page
        // (LoginGuard will redirect them to login if not signed in,
        //  then bring them back to /sell after sign in)
        if (role === 'seller') {
            navigate('/sell');
        } else {
            navigate('/');
        }
    }

    const card = (onClick, bg, border, accent, icon, label, sub) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
                padding: '20px 12px 16px', borderRadius: 16,
                border: `2.5px solid ${border}`, background: bg,
                cursor: 'pointer', transition: 'transform 0.18s',
                width: '100%',
            }}
            onMouseEnter={e =>
                e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e =>
                e.currentTarget.style.transform = 'none'}
        >
            <span style={{ fontSize: 38 }}>{icon}</span>
            <span style={{
                fontSize: 15, fontWeight: 900,
                color: accent, fontFamily: 'Poppins,sans-serif',
            }}>
                {label}
            </span>
            <span style={{
                fontSize: 10, color: '#888',
                textAlign: 'center', lineHeight: 1.4,
            }}>
                {sub}
            </span>
        </button>
    );

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '20px 16px',
            background:
                'linear-gradient(160deg,#0f5228 0%,#1a7a3c 55%,#0d3d1e 100%)',
        }}>
            {/* Language Selector — fixed top-right */}
            <div style={{ position: 'fixed', top: 14, right: 16, zIndex: 9999 }}>
                <LanguageSelector />
            </div>
            {/* Logo */}
            <div style={{
                display: 'flex', alignItems: 'center',
                gap: 10, marginBottom: 24,
            }}>
                {/* Removed cow emoji here per rebrand */}
                <span style={{
                    fontFamily: 'Poppins,sans-serif',
                    fontSize: 24, fontWeight: 900, color: 'white',
                }}>
                    Kosalai
                </span>
            </div>

            {/* Card */}
            <div style={{
                background: 'white', borderRadius: 24,
                padding: '28px 24px 24px', width: '100%', maxWidth: 460,
                boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                textAlign: 'center',
            }}>
                <img src={logoImg} alt="Kosalai Logo" style={{ width: 200, height: 'auto', marginBottom: 16, objectFit: 'contain' }} />
                <h1 style={{
                    fontFamily: 'Poppins,sans-serif', fontSize: 21,
                    fontWeight: 900, color: '#1a1a1a', margin: '0 0 6px',
                }}>
                    {t('onboardingPage.welcome')}
                </h1>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 22px' }}>
                    {t('onboardingPage.subtitle')}
                </p>

                {/* Cattle */}
                <div style={{
                    fontSize: 12, fontWeight: 800, color: '#555',
                    textAlign: 'left', marginBottom: 10,
                }}>
                    🐄 {t('onboardingPage.cattle')}
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 10, marginBottom: 16,
                }}>
                    {card(
                        () => go('buyer', 'livestock'),
                        '#e8f5e9', '#1a7a3c', '#1a7a3c',
                        '🐄', t('onboardingPage.buyCattle'), t('onboardingPage.buyCattleSub')
                    )}
                    {card(
                        () => go('seller', 'livestock'),
                        '#fff3e8', '#e65c00', '#e65c00',
                        '🏷️', t('onboardingPage.sellCattle'), t('onboardingPage.sellCattleSub')
                    )}
                </div>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 12, margin: '0 0 16px',
                    color: '#ccc', fontSize: 12,
                }}>
                    <div style={{ flex: 1, height: 1, background: '#eee' }} />
                    <span>{t('onboardingPage.or')}</span>
                    <div style={{ flex: 1, height: 1, background: '#eee' }} />
                </div>

                {/* Pets */}
                <div style={{
                    fontSize: 12, fontWeight: 800, color: '#555',
                    textAlign: 'left', marginBottom: 10,
                }}>
                    🐕 {t('onboardingPage.pets')}
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 10, marginBottom: 8,
                }}>
                    {card(
                        () => go('buyer', 'pets'),
                        '#e3f2fd', '#1565c0', '#1565c0',
                        '🐕', t('onboardingPage.buyPets'), t('onboardingPage.buyPetsSub')
                    )}
                    {card(
                        () => go('seller', 'pets'),
                        '#f0ebff', '#6c3fc5', '#6c3fc5',
                        '🏷️', t('onboardingPage.sellPets'), t('onboardingPage.sellPetsSub')
                    )}
                </div>

                <p style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>
                    🔒 {t('onboardingPage.noAccountNeeded')}
                </p>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: 18, fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
            }}>
                {t('onboardingPage.alreadyHaveAccount')}{' '}
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        background: 'none', border: 'none',
                        color: '#F9E04B', fontWeight: 800,
                        fontSize: 13, cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    {t('onboardingPage.signIn')}
                </button>
            </div>
        </div>
    );
}
