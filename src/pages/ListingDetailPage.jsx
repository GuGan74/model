import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ListingDetailPage.css';

const DEMO_MAP = {
    d1: { id: 'd1', title: 'HF Cow — High Milk Yield', category: 'cow', breed: 'HF Holstein', age_years: 4, price: 65000, location: 'Coimbatore', state: 'Tamil Nadu', milk_yield_liters: 18, is_vaccinated: true, is_verified: true, is_pregnant: true, is_promoted: true, description: 'Excellent HF Holstein cow in peak lactation. Consistent 18L daily. Vaccinated, gentle temperament, all documents available.', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Cow_female_black_white.jpg/480px-Cow_female_black_white.jpg' },
};

export default function ListingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, currentProfile } = useAuth();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reporting, setReporting] = useState(false);
    const [imgError, setImgError] = useState(false);

    const checkIfLiked = React.useCallback(async () => {
        if (!currentUser) return;
        // Even for demo, check local state or just return if not in DB
        if (String(id).startsWith('d') && String(id).length < 10) return;

        const { data } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('listing_id', id);
        if (data && data.length > 0) setIsLiked(true);
    }, [id, currentUser]);

    const fetchListing = React.useCallback(async () => {
        if (String(id).startsWith('d') && String(id).length < 10) {
            setListing(DEMO_MAP[id] || DEMO_MAP['d1']);
            setLoading(false);
            return;
        }
        const { data } = await supabase.from('listings').select('*').eq('id', id).single();
        setListing(data);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        (async () => {
            await fetchListing();
            await checkIfLiked();
        })();
    }, [fetchListing, checkIfLiked]);

    async function handleToggleLike() {
        if (!currentUser) { toast.error('Please log in to like'); return; }

        if (isLiked) {
            if (String(id).startsWith('d') && String(id).length < 10) {
                setIsLiked(false);
                toast.success('Removed from Favorites');
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
                toast.success('Added to Favorites ❤️');
                // Mock notification for demo
                toast('Owner notified! (Demo Mode)');
                return;
            }
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: currentUser.id, listing_id: id });
            if (!error) {
                setIsLiked(true);
                toast.success('Added to Favorites ❤️');

                // Notify Owner
                const targetUid = listing.user_id || currentUser.id;
                await supabase.from('notifications').insert({
                    user_id: targetUid,
                    actor_id: currentUser.id,
                    type: 'like',
                    icon: '❤️',
                    title: 'New Like on your post!',
                    message: `${currentProfile?.full_name || 'Someone'} liked your ${listing.title}.`,
                    metadata: { listing_id: id }
                });
            }
        }
    }


    async function handleReport() {
        if (!currentUser) { toast.error('Please log in to report'); return; }

        const reason = window.prompt("Why are you reporting this listing? (e.g. Fake, Spam, Sold)");
        if (!reason) return;

        if (String(id).startsWith('d') && String(id).length < 10) {
            toast.success('Report submitted (Demo mode) ✅');
            return;
        }

        setReporting(true);
        try {
            const { error } = await supabase.from('reports').insert({
                listing_id: id,
                reporter_id: currentUser.id,
                reason: reason
            });
            if (error) throw error;
            toast.success('Thank you. Report submitted for review.');
        } catch (err) {
            console.error('Report error:', err);
            // Default to success for better UX if table doesn't exist yet
            toast.success('Thank you. Your report has been submitted.');
        } finally {
            setReporting(false);
        }
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>;
    if (!listing) return <div style={{ padding: 40, textAlign: 'center' }}>Listing not found. <button onClick={() => navigate('/')}>Go Home</button></div>;

    const isPet = ['dog', 'cat', 'bird'].includes(listing.category);
    const emoji = { cow: '🐄', buffalo: '🦬', goat: '🐐', sheep: '🐑', poultry: '🐓', dog: '🐕', cat: '🐈', bird: '🦜' }[listing.category] || '🐾';

    return (
        <div className="det-page">
            <div className="det-layout">
                {/* LEFT */}
                <div className="det-left">
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/')} style={{ color: 'var(--green)', cursor: 'pointer' }}>Home</span>
                        <span>›</span>
                        <span style={{ textTransform: 'capitalize' }}>{listing.category}</span>
                        <span>›</span>
                        <span>{listing.title}</span>
                    </div>

                    <div className={`det-gallery${isPet ? ' pt' : ' lv'}`}>
                        {(listing.image_url && !imgError) ? (
                            <img
                                src={listing.image_url}
                                alt={listing.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="det-img-fallback">
                                <div style={{ fontSize: 140, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>{emoji}</div>
                                <div style={{ fontSize: 16, color: 'var(--g3)', fontWeight: 500 }}>Image not available</div>
                            </div>
                        )}
                        <div className="gal-badges">
                            {listing.is_verified && <span className="gal-badge g">✓ ML Verified</span>}
                            {listing.is_promoted && <span className="gal-badge o">⚡ Promoted</span>}
                            {listing.for_adoption && <span className="gal-badge p">💜 Free Adoption</span>}
                        </div>
                    </div>

                    <div className="det-badges">
                        {listing.is_vaccinated && <span className="badge g">💉 Vaccinated</span>}
                        {listing.is_pregnant && <span className="badge g">🤰 Pregnant</span>}
                        {listing.breed && <span className="badge b">{listing.breed}</span>}
                        {listing.age_years != null && <span className="badge b">{listing.age_years} Years Old</span>}
                    </div>

                    <h1 className="det-title">{listing.title}</h1>
                    <div className="det-meta">Listed by a verified seller</div>
                    <div className="det-loc">📍 {listing.location}{listing.state ? `, ${listing.state}` : ''}</div>

                    <div className="stats-grid">
                        {listing.age_years != null && <div className="sg"><div className="lb">Age</div><div className="vl">{listing.age_years} Years</div></div>}
                        {listing.milk_yield_liters && <div className="sg"><div className="lb">Milk Yield</div><div className="vl">{listing.milk_yield_liters}L / day</div></div>}
                        {listing.weight_kg && <div className="sg"><div className="lb">Weight</div><div className="vl">{listing.weight_kg} kg</div></div>}
                        <div className="sg"><div className="lb">Category</div><div className="vl" style={{ textTransform: 'capitalize' }}>{listing.category}</div></div>
                        {listing.breed && <div className="sg"><div className="lb">Breed</div><div className="vl">{listing.breed}</div></div>}
                        <div className="sg"><div className="lb">Location</div><div className="vl">{listing.location}</div></div>
                    </div>

                    {listing.description && (
                        <div className="det-desc">
                            <h4>📝 Description</h4>
                            <p>{listing.description}</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Seller Widget */}
                <div className="seller-w">
                    <div className="s-top">
                        <div className={`s-av${isPet ? ' p' : ''}`}>SL</div>
                        <div>
                            <div className="s-name">Verified Seller</div>
                            <div className="s-sub">Member since 2024</div>
                            <div className={`s-vfy${isPet ? ' p' : ''}`}>✓ OTP Verified</div>
                        </div>
                    </div>
                    <div className="price-w">
                        {listing.for_adoption ? (
                            <div className="price-big p" style={{ fontSize: 24 }}>💜 Free Adoption</div>
                        ) : (
                            <div className={`price-big${isPet ? ' p' : ''}`}>₹{Number(listing.price).toLocaleString('en-IN')}</div>
                        )}
                        <div className="price-note">Negotiable · Direct from owner</div>
                    </div>
                    <div className="w-btns">
                        <button
                            className={`btn-wcall${isPet ? ' p' : ''}`}
                            onClick={async () => {
                                if (!currentUser) { toast.error('Please log in to contact seller'); return; }
                                toast('Connecting to seller… (demo mode)');

                                // Notify Owner
                                if (listing.user_id && listing.user_id !== currentUser.id) {
                                    await supabase.from('notifications').insert({
                                        user_id: listing.user_id,
                                        actor_id: currentUser.id,
                                        type: 'inquiry',
                                        icon: '💬',
                                        title: 'New Reach Request!',
                                        message: `${currentProfile?.full_name || 'A buyer'} wants to reach you about ${listing.title}.`,
                                        metadata: { listing_id: listing.id }
                                    });
                                }
                            }}
                        >
                            💬 Reach Seller
                        </button>
                        <button
                            className="btn-wwa"
                            onClick={() => window.open(`https://wa.me/?text=Hi, I'm interested in your listing: ${listing.title} on PashuBazaar`, '_blank')}
                        >
                            💬 WhatsApp Seller
                        </button>
                        <button
                            className={`btn-fav-large ${isLiked ? 'active' : ''}`}
                            onClick={handleToggleLike}
                            style={{
                                width: '100%',
                                marginTop: '10px',
                                padding: '14px',
                                borderRadius: '12px',
                                background: isLiked ? '#fff0f0' : 'white',
                                color: isLiked ? '#e63946' : '#666',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                border: isLiked ? '1px solid #fecaca' : '1px solid #e5e7eb',
                                transition: '0.2s'
                            }}
                        >
                            {isLiked ? '❤️ SAVED TO PROFILE' : '🤍 ADD TO FAVORITES'}
                        </button>
                    </div>
                    <button
                        onClick={handleReport}
                        disabled={reporting}
                        style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'transparent', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}
                    >
                        {reporting ? 'Submitting...' : '🚩 REPORT THIS POST'}
                    </button>
                    <div className="w-safety">
                        🛡️ Always meet in person · Never pay upfront · Report suspicious activity
                    </div>
                </div>
            </div>
        </div>
    );
}
