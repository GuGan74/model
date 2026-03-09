import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './BoostPage.css';

const TIERS = [
    { name: 'Basic', price: '₹99', period: '/7 days', badge: '', features: ['2× more views', 'Listed in search results', 'WhatsApp button shown'], color: 'var(--blue)', bg: 'var(--blue-light)', recommended: false },
    { name: 'Standard', price: '₹199', period: '/14 days', badge: 'POPULAR', features: ['5× more views', 'Featured on homepage', 'Priority in search', 'SMS alert to buyers'], color: 'var(--green)', bg: 'var(--green-light)', recommended: false },
    { name: 'Premium', price: '₹399', period: '/30 days', badge: 'BEST VALUE', features: ['10× more views', 'Top of search results', 'Promoted badge', 'SMS + WhatsApp alerts', 'Seller verified badge'], color: 'var(--orange)', bg: 'var(--orange-light)', recommended: true },
    { name: 'Elite', price: '₹799', period: '/60 days', badge: '', features: ['20× more views', 'Homepage hero slot', 'All Premium benefits', 'Dedicated support'], color: 'var(--purple)', bg: 'var(--purple-light)', recommended: false },
];

export default function BoostPage() {
    const navigate = useNavigate();
    return (
        <div className="boost-wrap">
            <div className="boost-hero">
                <h2>⚡ Boost Your Listing</h2>
                <p>Get your animal in front of thousands of serious buyers instantly</p>
            </div>
            <div className="boost-grid">
                {TIERS.map(t => (
                    <div key={t.name} className={`boost-card${t.recommended ? ' rec' : ''}`}>
                        <div className="bc-top">
                            <div className="bc-nm" style={{ color: t.color }}>{t.name}</div>
                            {t.badge && <div className="bc-badge">{t.badge}</div>}
                        </div>
                        <div className="bc-price" style={{ color: t.color }}>{t.price}</div>
                        <div className="bc-period">{t.period}</div>
                        <ul className="bc-feats">
                            {t.features.map(f => <li key={f}>{f}</li>)}
                        </ul>
                        <button
                            className="bc-btn"
                            style={{ background: t.bg, color: t.color, border: `1.5px solid ${t.color}33` }}
                            onClick={() => { toast.success(`Boosting with ${t.name} plan!`); navigate('/payment'); }}
                        >
                            {t.recommended ? '🚀 ' : ''}Boost Now
                        </button>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
            </div>
        </div>
    );
}
