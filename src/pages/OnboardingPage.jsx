import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { enterGuestMode } = useAuth();

    function go(role, category) {
        // Write to localStorage SYNCHRONOUSLY first
        // so App.jsx sees the change before React re-renders
        try {
            localStorage.setItem('pb_guest', 'true');
            localStorage.setItem('pb_guest_prefs',
                JSON.stringify({ role, category }));
        } catch { }
        // Then update React state
        enterGuestMode({ role, category });
        // Then navigate — by now localStorage is already set
        navigate('/');
    }

    const card = (onClick, bg, border, accent, icon, label, sub) => (
        <button onClick={onClick} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 6, padding: '20px 12px 16px', borderRadius: 16,
            border: `2.5px solid ${border}`, background: bg,
            cursor: 'pointer', transition: 'transform 0.18s',
            width: '100%',
        }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
            <span style={{ fontSize: 38 }}>{icon}</span>
            <span style={{
                fontSize: 15, fontWeight: 900,
                color: accent, fontFamily: 'Poppins,sans-serif'
            }}>
                {label}
            </span>
            <span style={{
                fontSize: 10, color: '#888', textAlign: 'center',
                lineHeight: 1.4
            }}>{sub}</span>
        </button>
    );

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px 16px',
            background: 'linear-gradient(160deg,#0f5228 0%,#1a7a3c 55%,#0d3d1e 100%)',
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 24
            }}>
                <span style={{ fontSize: 34 }}>🐄</span>
                <span style={{
                    fontFamily: 'Poppins,sans-serif', fontSize: 24,
                    fontWeight: 900, color: 'white'
                }}>PashuBazaar</span>
            </div>

            {/* Card */}
            <div style={{
                background: 'white', borderRadius: 24,
                padding: '28px 24px 24px', width: '100%', maxWidth: 460,
                boxShadow: '0 24px 64px rgba(0,0,0,0.35)', textAlign: 'center',
            }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🌾</div>
                <h1 style={{
                    fontFamily: 'Poppins,sans-serif', fontSize: 21,
                    fontWeight: 900, color: '#1a1a1a', margin: '0 0 6px'
                }}>
                    Welcome to PashuBazaar
                </h1>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 22px' }}>
                    South India's most trusted animal marketplace
                </p>

                {/* Animals */}
                <div style={{
                    fontSize: 12, fontWeight: 800, color: '#555',
                    textAlign: 'left', marginBottom: 10
                }}>
                    🐄 Animals (Livestock)
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 10, marginBottom: 16
                }}>
                    {card(
                        () => go('buyer', 'livestock'),
                        '#e8f5e9', '#1a7a3c', '#1a7a3c',
                        '🐄', 'Buy Animals', 'Cows · Buffaloes · Goats · Sheep'
                    )}
                    {card(
                        () => go('seller', 'livestock'),
                        '#fff3e8', '#e65c00', '#e65c00',
                        '🏷️', 'Sell Animals', 'Post livestock listings'
                    )}
                </div>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 12, margin: '0 0 16px', color: '#ccc', fontSize: 12
                }}>
                    <div style={{ flex: 1, height: 1, background: '#eee' }} />
                    <span>or</span>
                    <div style={{ flex: 1, height: 1, background: '#eee' }} />
                </div>

                {/* Pets */}
                <div style={{
                    fontSize: 12, fontWeight: 800, color: '#555',
                    textAlign: 'left', marginBottom: 10
                }}>
                    🐕 Pets
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 10, marginBottom: 8
                }}>
                    {card(
                        () => go('buyer', 'pets'),
                        '#e3f2fd', '#1565c0', '#1565c0',
                        '🐕', 'Buy Pets', 'Dogs · Cats · Birds & more'
                    )}
                    {card(
                        () => go('seller', 'pets'),
                        '#f0ebff', '#6c3fc5', '#6c3fc5',
                        '🏷️', 'Sell Pets', 'Post pet listings'
                    )}
                </div>

                <p style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>
                    🔒 No account needed to browse · Free to join
                </p>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: 18, fontSize: 13,
                color: 'rgba(255,255,255,0.75)'
            }}>
                Already have an account?{' '}
                <button onClick={() => navigate('/login')}
                    style={{
                        background: 'none', border: 'none',
                        color: '#F9E04B', fontWeight: 800,
                        fontSize: 13, cursor: 'pointer',
                        textDecoration: 'underline'
                    }}>
                    Sign in
                </button>
            </div>
        </div>
    );
}
