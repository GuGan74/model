import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ListingCard.css';

const BG_MAP = {
    cow: '#fffde7', buffalo: '#e8edf5', goat: '#f0fff4', sheep: '#fff8e1',
    poultry: '#fff3e8', dog: '#f0ebff', cat: '#fff0f6', bird: '#e3f8ff',
};

export default function ListingCard({ listing }) {
    const navigate = useNavigate();

    const {
        id, title, category, location: loc, state, price,
        milk_yield_liters, age_years, is_vaccinated, for_adoption, image_url,
        user_id: owner_id
    } = listing;
    const { currentUser, currentProfile } = useAuth();
    const [isLiked, setIsLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(0);

    const bg = BG_MAP[category] || '#f7f8fa';

    const emoji = {
        cow: '🐄', buffalo: '🦬', goat: '🐐', sheep: '🐑',
        poultry: '🐓', dog: '🐕', cat: '🐈', bird: '🦜',
    }[category] || '🐾';

    const isPet = ['dog', 'cat', 'bird'].includes(category);

    const checkIfLiked = React.useCallback(async () => {
        if (!currentUser || (String(id).startsWith('d') && String(id).length < 10)) return;
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('listing_id', id);

        if (data && data.length > 0) setIsLiked(true);
    }, [currentUser, id]);

    React.useEffect(() => {
        checkIfLiked();
    }, [checkIfLiked]);

    async function handleLike(e) {
        e.stopPropagation();
        if (!currentUser) {
            toast.error('Please log in to like posts');
            return;
        }

        if (isLiked) {
            if (String(id).startsWith('d') && String(id).length < 10) {
                setIsLiked(false);
                toast.success('Removed from favorites');
                return;
            }
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('listing_id', id);
            if (!error) setIsLiked(false);
        } else {
            if (String(id).startsWith('d') && String(id).length < 10) {
                setIsLiked(true);
                toast.success('Added to favorites! ❤️');
                toast('Owner notified! (Demo Mode)');
                return;
            }
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: currentUser.id, listing_id: id });
            if (!error) {
                setIsLiked(true);
                toast.success('Added to favorites!');

                // Notify Owner
                const targetUid = owner_id || currentUser.id;
                await supabase.from('notifications').insert({
                    user_id: targetUid,
                    actor_id: currentUser.id,
                    type: 'like',
                    icon: '❤️',
                    title: 'New Like on your listing!',
                    message: `${currentProfile?.full_name || 'Someone'} liked your ${title}.`,
                    metadata: { listing_id: id }
                });
            }
        }
    }

    return (
        <div className="listing-card" onClick={() => navigate(`/listing/${id}`)}>
            {/* Image Box */}
            <div className={`lc-img-box${!image_url ? ' show-emoji' : ''}`} style={{ background: bg }}>
                {is_vaccinated ? (
                    <div className="lc-badge green">VACCINATED</div>
                ) : (
                    <div className="lc-badge gray">PENDING</div>
                )}

                {listing.is_promoted && (
                    <div className="lc-badge promoted">⚡ PROMOTED</div>
                )}

                <div className={`lc-heart ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#EF4444" : "none"} stroke={isLiked ? "#EF4444" : "currentColor"} strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>

                {image_url ? (
                    <img
                        src={image_url}
                        alt={title}
                        className="lc-img-actual"
                        onError={e => { e.target.classList.add('hide'); e.target.parentElement.classList.add('show-emoji'); }}
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
                            <div className="stat-col">
                                <div className="stat-lbl">MILK YIELD</div>
                                <div className="stat-val">{milk_yield_liters ? `${milk_yield_liters}L/day` : 'N/A'}</div>
                            </div>
                            <div className="stat-col">
                                <div className="stat-lbl">AGE</div>
                                <div className="stat-val">{age_years ? `${age_years} Years` : 'Unknown'}</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-col">
                                <div className="stat-lbl">TYPE</div>
                                <div className="stat-val">Pet Adoption</div>
                            </div>
                            <div className="stat-col">
                                <div className="stat-lbl">AGE</div>
                                <div className="stat-val">{age_years ? `${age_years} Years` : 'Puppy/Kitten'}</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="lc-actions">
                    <button className="lc-btn-chat" onClick={async (e) => {
                        e.stopPropagation();
                        if (owner_id && currentUser && owner_id !== currentUser.id) {
                            await supabase.from('notifications').insert({
                                user_id: owner_id,
                                actor_id: currentUser.id,
                                type: 'inquiry',
                                icon: '💬',
                                title: 'New chat inquiry!',
                                message: `${currentProfile?.full_name || 'A buyer'} wants to reach you about ${title}.`,
                                metadata: { listing_id: id }
                            });
                        }
                        navigate(`/listing/${id}`);
                    }}>
                        💬 Reach Seller
                    </button>
                    <button className="lc-btn-call" onClick={async (e) => {
                        e.stopPropagation();
                        if (owner_id && currentUser && owner_id !== currentUser.id) {
                            await supabase.from('notifications').insert({
                                user_id: owner_id,
                                actor_id: currentUser.id,
                                type: 'inquiry',
                                icon: '📞',
                                title: 'New call inquiry!',
                                message: `${currentProfile?.full_name || 'A buyer'} clicked call for ${title}.`,
                                metadata: { listing_id: id }
                            });
                        }
                        navigate(`/listing/${id}`);
                    }}>
                        💬 Reach Seller
                    </button>
                </div>
            </div>
        </div>
    );
}
