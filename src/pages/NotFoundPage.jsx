import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
    const navigate = useNavigate();
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '70vh', textAlign: 'center',
            fontFamily: 'Nunito, sans-serif', padding: '40px 20px'
        }}>
            <div style={{ fontSize: 90, marginBottom: 16 }}>🐄💨</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a3c28', marginBottom: 8 }}>
                Oops! This animal has wandered off...
            </h1>
            <p style={{ color: '#6b7280', marginBottom: 28, maxWidth: 380, fontSize: 15 }}>
                The page you're looking for doesn't exist or has moved.
            </p>
            <button
                onClick={() => navigate('/')}
                style={{
                    padding: '14px 32px', background: '#1a7a3c', color: 'white',
                    border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16,
                    cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                    boxShadow: '0 4px 16px rgba(26,122,60,0.3)'
                }}
            >
                🏠 Back to Home
            </button>
        </div>
    );
}
