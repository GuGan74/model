import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SuccessPage.css';

export default function SuccessPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const listing = state?.listing;
    const [id] = React.useState(() => listing?.id || 'PB' + Date.now().toString().slice(-6));

    return (
        <div className="suc-wrap">
            <div className="suc-circle">🎉</div>
            <h1 className="suc-ttl">Listing Published!</h1>
            <p className="suc-sub">Your cattle is now live on Kosalai and visible to all buyers across India. You'll receive WhatsApp / call inquiries directly.</p>

            <div className="suc-id">
                <div className="lb">LISTING ID</div>
                <div className="id">{id}</div>
                <div className="meta">Published just now · Active for 30 days</div>
            </div>

            <div className="suc-btns">
                <button className="btn-view" onClick={() => listing?.id ? navigate(`/listing/${listing.id}`) : navigate('/')}>View Listing</button>
                <button className="btn-post2" onClick={() => navigate('/sell')}>+ Post Another</button>
            </div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => navigate('/')}>
                ← Back to Home
            </button>
        </div>
    );
}
