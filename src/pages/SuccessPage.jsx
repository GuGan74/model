import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './SuccessPage.css';

export default function SuccessPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { state } = useLocation();
    const listing = state?.listing;
    const [id] = React.useState(() => listing?.id || 'PB' + Date.now().toString().slice(-6));

    return (
        <div className="suc-wrap">
            <div className="suc-circle">🎉</div>
            <h1 className="suc-ttl">{t('success.congratulations')}</h1>
            <p className="suc-sub">{t('success.listingPosted')}. {t('success.receiveInquiries')}.</p>

            <div className="suc-id">
                <div className="lb">LISTING ID</div>
                <div className="id">{id}</div>
                <div className="meta">{t('success.manageListing')}</div>
            </div>

            <div className="suc-btns">
                <button className="btn-view" onClick={() => listing?.id ? navigate(`/listing/${listing.id}`) : navigate('/')}>{t('success.viewListing')}</button>
                <button className="btn-post2" onClick={() => navigate('/sell')}>+ {t('success.createAnother')}</button>
            </div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => navigate('/')}>
                ← {t('common.back')}
            </button>
        </div>
    );
}
