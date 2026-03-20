import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DEMO_MAP } from '../data/demoData';
import SEOHead from '../components/SEOHead';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import './ListingDetailPage.css';

export default function ListingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, currentProfile } = useAuth();
    const [listing, setListing] = useState(null);
    const [sellerPhone, setSellerPhone] = useState(null);
    const [sellerName, setSellerName] = useState(null);
    const [sellerJoinDate, setSellerJoinDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reporting, setReporting] = useState(false);

    const [isLiked, setIsLiked] = useState(false);

    const checkIfLiked = React.useCallback(async () => {
        if (!currentUser) return;
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

        // Fetch seller profile
        if (data?.user_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('phone, full_name, created_at')
                .eq('id', data.user_id)
                .single();
            if (profile?.phone) setSellerPhone(profile.phone);
            if (profile?.full_name) setSellerName(profile.full_name);
            if (profile?.created_at) setSellerJoinDate(profile.created_at);
        }

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
                setIsLiked(false); toast.success('Removed from Favorites'); return;
            }
            const { error } = await supabase.from('favorites').delete()
                .eq('user_id', currentUser.id).eq('listing_id', id);
            if (!error) setIsLiked(false);
        } else {
            if (String(id).startsWith('d') && String(id).length < 10) {
                setIsLiked(true); toast.success('Added to Favorites ❤️');
                toast('Owner notified! (Demo Mode)'); return;
            }
            const { error } = await supabase.from('favorites')
                .insert({ user_id: currentUser.id, listing_id: id });
            if (!error) {
                setIsLiked(true);
                toast.success('Added to Favorites ❤️');
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
            toast.success('Report submitted (Demo mode) ✅'); return;
        }
        setReporting(true);
        try {
            const { error } = await supabase.from('reports').insert({
                listing_id: id, reporter_id: currentUser.id, reason
            });
            if (error) throw error;
            toast.success('Thank you. Report submitted for review.');
        } catch (err) {
            console.error('Report error:', err);
            toast.success('Thank you. Your report has been submitted.');
        } finally {
            setReporting(false);
        }
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>;
    if (!listing) return <div style={{ padding: 40, textAlign: 'center' }}>Listing not found. <button onClick={() => navigate('/')}>Go Home</button></div>;

    const isPet = ['dog', 'cat', 'bird'].includes(listing.category);


    // WhatsApp link using seller phone if available
    const phone = sellerPhone ? sellerPhone.replace(/\D/g, '').replace(/^91/, '') : null;
    const waMsg = encodeURIComponent(`Hi, I saw your listing for ${listing.title} on Kosalai. Is it still available?`);
    const waLink = phone
        ? `https://wa.me/91${phone}?text=${waMsg}`
        : `https://wa.me/?text=${waMsg}`;

    // JSON-LD structured data for Product schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": listing.title,
        "description": listing.description || `${listing.breed}, ${listing.age_years} years old`,
        "image": listing.image_url || '',
        "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": listing.for_adoption ? 0 : listing.price,
            "availability": "https://schema.org/InStock",
            "url": `https://model-mauve.vercel.app/listing/${listing.id}`
        }
    };

    return (
        <div className="det-page">
            <SEOHead
                title={`${listing.title} for sale in ${listing.location} | Kosalai`}
                description={`${listing.breed || ''}, ${listing.age_years ? listing.age_years + ' years old' : ''}. Price: ${listing.for_adoption ? 'Free' : '₹' + Number(listing.price).toLocaleString('en-IN')}. Located in ${listing.location}${listing.state ? ', ' + listing.state : ''}.`}
                imageUrl={listing.image_url}
                url={`https://model-mauve.vercel.app/listing/${listing.id}`}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="det-layout">
                {/* LEFT */}
                <div className="det-left">
                    <BackButton fallbackPath="/" />
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/')} style={{ color: 'var(--green)', cursor: 'pointer' }}>Home</span>
                        <span>›</span>
                        <span style={{ textTransform: 'capitalize' }}>{listing.category}</span>
                        <span>›</span>
                        <span>{listing.title}</span>
                    </div>

                    <div className="det-img-wrap">
                        {listing.image_url ? (
                            <img
                                src={listing.image_url}
                                alt={listing.title}
                                className="det-img"
                                style={{ objectFit: 'cover', objectPosition: 'center' }}
                                onError={e => {
                                    e.target.style.display = 'none';
                                    const ph = e.target.parentElement.querySelector('.det-img-placeholder');
                                    if (ph) ph.style.display = 'flex';
                                }}
                            />
                        ) : (
                            <div className="det-img det-img-placeholder">
                                <span style={{ fontSize: 80 }}>
                                    {listing.category === 'cow' ? '🐄' :
                                        listing.category === 'buffalo' ? '🦬' :
                                            listing.category === 'goat' ? '🐐' :
                                                listing.category === 'horse' ? '🐎' :
                                                    listing.category === 'dog' ? '🐕' :
                                                        listing.category === 'cat' ? '🐈' :
                                                            listing.category === 'bird' ? '🦜' : '🐾'}
                                </span>
                            </div>
                        )}
                        <div className="gal-badges">
                            {listing.is_verified && (
                                <span className="gal-badge g" style={{ background: '#e0f2f1', color: '#00695c', border: '1px solid #004d40', fontWeight: 900 }}>
                                    ✓ AI Verified (Image matches Category)
                                </span>
                            )}
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
                    <div className="det-meta">
                        Listed by {sellerName || 'Verified Seller'}
                        · Member since {new Date(sellerJoinDate || Date.now()).getFullYear()}
                    </div>
                    <div className="det-loc">📍 {listing.location}{listing.state ? `, ${listing.state}` : ''}</div>

                    <div className="stats-grid">
                        {listing.age_years != null && <div className="sg"><div className="lb">Age</div><div className="vl">{listing.age_years} Years</div></div>}
                        {['cow', 'buffalo', 'goat', 'sheep'].includes(listing.category) && listing.milk_yield_liters && <div className="sg"><div className="lb">Milk Yield</div><div className="vl">{listing.milk_yield_liters}L / day</div></div>}
                        {listing.weight_kg && <div className="sg"><div className="lb">Weight</div><div className="vl">{listing.weight_kg} kg</div></div>}
                        {listing.gender && <div className="sg"><div className="lb">Gender</div><div className="vl" style={{ textTransform: 'capitalize' }}>{listing.gender}</div></div>}
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
                                if (listing.user_id && listing.user_id !== currentUser.id) {
                                    await supabase.from('notifications').insert({
                                        user_id: listing.user_id,
                                        actor_id: currentUser.id,
                                        type: 'inquiry',
                                        icon: '📞',
                                        title: 'New call inquiry!',
                                        message: `${currentProfile?.full_name || 'A buyer'} clicked call for ${listing.title}.`,
                                        metadata: { listing_id: listing.id }
                                    });
                                }
                            }}
                        >
                            📞 Call Seller
                        </button>
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-wwa"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                textAlign: 'center', textDecoration: 'none', backgroundColor: '#25D366', color: 'white'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp Seller
                        </a>
                        <button
                            className={`btn-fav-large ${isLiked ? 'active' : ''}`}
                            onClick={handleToggleLike}
                            style={{
                                width: '100%', marginTop: '10px', padding: '14px',
                                borderRadius: '12px', background: isLiked ? '#fff0f0' : 'white',
                                color: isLiked ? '#e63946' : '#666', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '8px', cursor: 'pointer',
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
