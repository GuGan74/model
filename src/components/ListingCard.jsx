import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import './ListingCard.css';

const BG_MAP = {
    cow: '#fffde7', buffalo: '#e8edf5', goat: '#f0fff4', horse: '#fff8e1',
    poultry: '#fff3e8', dog: '#f0ebff', cat: '#fff0f6', bird: '#e3f8ff',
};

const ListingCard = React.memo(function ListingCard({ listing, isLiked: isLikedProp = false, onToggleFavorite }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const {
        id, title, category, location: loc, state, price,
        milk_yield_liters, age_years, is_vaccinated, for_adoption, image_url,
        user_id: owner_id
    } = listing;

    const { currentUser, currentProfile, isLoggedIn } = useAuth();
    // Use prop-driven liked state (from parent batch query), with local override capability
    const [localLiked, setLocalLiked] = React.useState(null);
    const isLiked = localLiked !== null ? localLiked : isLikedProp;

    const bg = BG_MAP[category] || '#f7f8fa';

    const emoji = {
        cow: '🐄', buffalo: '🦬', goat: '🐐', horse: '🐎',
        poultry: '🐓', dog: '🐕', cat: '🐈', bird: '🦜',
    }[category] || '🐾';

    const isPet = ['dog', 'cat', 'bird', 'fish', 'rabbit'].includes(category);

    async function handleLike(e) {
        e.stopPropagation();
        if (!currentUser) {
            toast.error('Please log in to like posts');
            return;
        }

        // Optimistic update
        setLocalLiked(!isLiked);

        if (onToggleFavorite) {
            await onToggleFavorite(id, listing, currentProfile);
        } else {
            // Fallback: direct DB call if no parent handler
            const isDemo = String(id).startsWith('d') && String(id).length < 10;
            if (isLiked) {
                if (!isDemo) await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('listing_id', id);
                toast.success(t('listingCard.removedFromFavorites'));
            } else {
                if (!isDemo) await supabase.from('favorites').insert({ user_id: currentUser.id, listing_id: id });
                toast.success(t('listingCard.addedToFavorites'));
            }
        }
    }

    return (
        <div
            className="listing-card"
            role="button"
            tabIndex={0}
            aria-label={`View ${title}, priced at ${for_adoption ? 'Free' : '₹' + Number(price).toLocaleString('en-IN')}`}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/listing/${id}`);
                }
            }}
            onClick={() => {
                if (!isLoggedIn) {
                    sessionStorage.setItem('pb_redirect_after_login', `/listing/${id}`);
                    toast('Sign in to view full listing details 🔐', { icon: '👆', duration: 2500 });
                    setTimeout(() => navigate('/login'), 800);
                    return;
                }
                navigate(`/listing/${id}`);
            }}
        >
            {/* Image Box */}
            <div className={`lc-img-box${!image_url ? ' show-emoji' : ''}`} style={{ background: bg }}>
                {listing.is_verified ? (
                    <div className="lc-badge green">✓ Verified</div>
                ) : (
                    <div className="lc-badge gray">⚠ Not Verified</div>
                )}

                <div className={`lc-heart ${isLiked ? 'liked' : ''}`} onClick={handleLike} aria-label={t('listingCard.addToFavorites')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#EF4444" : "none"} stroke={isLiked ? "#EF4444" : "currentColor"} strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>

                {image_url ? (
                    <img
                        src={image_url}
                        alt={title}
                        className="lc-img-actual"
                        loading="lazy"
                        width={480}
                        height={320}
                        onError={e => {
                            e.target.style.display = 'none';
                            e.target.parentElement.classList.add('show-emoji');
                        }}
                    />
                ) : null}
                <div className="lc-emoji">{emoji}</div>
            </div>

            {/* Content Box */}
            <div className="lc-content">
                <div className="lc-header-row">
                    <div className="lc-title">{title}</div>
                    <div className="lc-price">
                        {for_adoption ? 'Free' : `₹${Number(price).toLocaleString('en-IN')}`}
                    </div>
                </div>

                <div className="lc-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {loc}{state ? `, ${state}` : ''}
                </div>

                <div className="lc-stats-grid">
                    {!isPet ? (
                        <>
                            {['cow', 'buffalo', 'goat', 'sheep'].includes(category) && (
                                <div className="stat-col">
                                    <div className="stat-lbl">MILK YIELD</div>
                                    <div className="stat-val">{milk_yield_liters ? `${milk_yield_liters}L/day` : 'N/A'}</div>
                                </div>
                            )}
                            <div className="stat-col">
                                <div className="stat-lbl">AGE</div>
                                <div className="stat-val">{age_years ? `${age_years} Years` : 'Unknown'}</div>
                            </div>
                            <div className="stat-col">
                                <div className="stat-lbl">GENDER</div>
                                <div className="stat-val" style={{ textTransform: 'capitalize' }}>{listing.gender || 'Unknown'}</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-col">
                                <div className="stat-lbl">AGE</div>
                                <div className="stat-val">{age_years ? `${age_years} Years` : 'Unknown'}</div>
                            </div>
                            <div className="stat-col">
                                <div className="stat-lbl">GENDER</div>
                                <div className="stat-val" style={{ textTransform: 'capitalize' }}>{listing.gender || 'Unknown'}</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="lc-actions">
                    <button className="lc-btn-chat" onClick={async (e) => {
                        e.stopPropagation();
                        if (!isLoggedIn) {
                            sessionStorage.setItem('pb_redirect_after_login', `/listing/${id}`);
                            toast('Sign in to view seller profile 🔐', { icon: '👆', duration: 2500 });
                            setTimeout(() => navigate('/login'), 800);
                            return;
                        }
                        navigate(`/seller/${owner_id || 'demo-seller'}`);
                    }}>
                        👤 View Seller
                    </button>
                    <button className="lc-btn-call" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/listing/${id}`);
                    }}>
                        📋 Details
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ListingCard;
