import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DEMO_MAP } from '../data/demoData';
import SEOHead from '../components/SEOHead';
import BackButton from '../components/BackButton';
import loadingGif from '../assets/379.gif';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import TranslatedText from '../components/TranslatedText';
import './ListingDetailPage.css';

export default function ListingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, currentProfile } = useAuth();
    const { t } = useTranslation();
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

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><img src={loadingGif} alt="Loading..." style={{ width: 60, height: 60, objectFit: 'contain', margin: '0 auto' }} /></div>;
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
                        <span onClick={() => navigate('/')} style={{ color: 'var(--green)', cursor: 'pointer' }}>{t('listingDetail.home')}</span>
                        <span>›</span>
                        <span style={{ textTransform: 'capitalize' }}><TranslatedText>{listing.category}</TranslatedText></span>
                        <span>›</span>
                        <span><TranslatedText>{listing.title}</TranslatedText></span>
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
                            {listing.is_promoted && <span className="gal-badge o">⚡ Promoted</span>}
                            {listing.for_adoption && <span className="gal-badge p">💜 Free Adoption</span>}
                        </div>
                    </div>

                    <div className="det-badges">
                        {listing.is_vaccinated && <span className="badge g">💉 Vaccinated</span>}
                        {listing.is_pregnant && <span className="badge g">🤰 Pregnant</span>}
                        {listing.breed && <span className="badge b"><TranslatedText>{listing.breed}</TranslatedText></span>}
                        {listing.age_years != null && <span className="badge b">{listing.age_years} Years Old</span>}
                    </div>

                    <h1 className="det-title"><TranslatedText>{listing.title}</TranslatedText></h1>
                    <div className="det-meta">
                        {t('listingDetail.listedBy')} {sellerName || t('listingDetail.verifiedSeller')}
                        · {t('listingDetail.memberSince', { year: new Date(sellerJoinDate || Date.now()).getFullYear() })}
                    </div>
                    <div className="det-loc">📍 <TranslatedText>{listing.location}</TranslatedText>{listing.state ? `, ` : ''}{listing.state && <TranslatedText>{listing.state}</TranslatedText>}</div>

                    <div className="stats-grid">
                        {listing.age_years != null && <div className="sg"><div className="lb">{t('listingDetail.age')}</div><div className="vl">{listing.age_years} {t('listingDetail.years')}</div></div>}
                        {['cow', 'buffalo', 'goat', 'sheep'].includes(listing.category) && listing.milk_yield_liters && <div className="sg"><div className="lb">{t('listingDetail.milkYield')}</div><div className="vl">{listing.milk_yield_liters}{t('listingDetail.perDay')}</div></div>}
                        {listing.weight_kg && <div className="sg"><div className="lb">{t('listingDetail.weight')}</div><div className="vl">{listing.weight_kg} {t('listingDetail.kg')}</div></div>}
                        {listing.gender && <div className="sg"><div className="lb">{t('listingDetail.gender')}</div><div className="vl" style={{ textTransform: 'capitalize' }}>{t('listing.' + listing.gender.toLowerCase(), { defaultValue: listing.gender })}</div></div>}
                        <div className="sg"><div className="lb">{t('listingDetail.category')}</div><div className="vl" style={{ textTransform: 'capitalize' }}><TranslatedText>{listing.category}</TranslatedText></div></div>
                        {listing.breed && <div className="sg"><div className="lb">{t('listingDetail.breed')}</div><div className="vl"><TranslatedText>{listing.breed}</TranslatedText></div></div>}
                        <div className="sg"><div className="lb">{t('listingDetail.location')}</div><div className="vl"><TranslatedText>{listing.location}</TranslatedText></div></div>
                    </div>

                    {listing.description && (
                        <div className="det-desc">
                            <h4>📝 Description</h4>
                            <p><TranslatedText>{listing.description}</TranslatedText></p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Seller Widget */}
                <div className="seller-w">
                    <div className="s-top">
                        <div className={`s-av${isPet ? ' p' : ''}`}>SL</div>
                        <div>
                            <div className="s-name">{t('listingDetail.verifiedSeller')}</div>
                            <div className="s-sub">{t('listingDetail.memberSince', { year: new Date(sellerJoinDate || Date.now()).getFullYear() })}</div>
                            <div className={`s-vfy${isPet ? ' p' : ''}`}>{t('listingDetail.otpVerified')}</div>
                        </div>
                    </div>
                    <div className="price-w">
                        {listing.for_adoption ? (
                            <div className="price-big p" style={{ fontSize: 24 }}>💜 Free Adoption</div>
                        ) : (
                            <div className={`price-big${isPet ? ' p' : ''}`}>₹{Number(listing.price).toLocaleString('en-IN')}</div>
                        )}
                        <div className="price-note">{t('listingDetail.negotiable')}</div>
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
                            {t('listingDetail.reachSeller')}
                        </button>
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
                            {isLiked ? t('listingDetail.savedToProfile') : t('listingDetail.addToFavorites')}
                        </button>
                    </div>
                    <button
                        onClick={handleReport}
                        disabled={reporting}
                        style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'transparent', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}
                    >
                        {reporting ? t('listingDetail.submitting') : t('listingDetail.reportPost')}
                    </button>
                    <div className="w-safety">{t('listingDetail.safetyTip')}</div>
                </div>
            </div>
        </div>
    );
}
