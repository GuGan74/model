import React, { useState, useEffect, useRef, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import { CATEGORIES } from '../constants/index';
import { useTranslation } from 'react-i18next';
import ListingCard from '../components/ListingCard';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import './HomePage.css';

const PET_CATEGORIES = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'other-pet'];
const PET_TAB_IDS = ['pets', 'dogs', 'dog', 'cats', 'cat', 'birds', 'bird',
    'fish', 'rabbit', 'other-pet'];

// Reads guestPrefs from context OR falls back to localStorage directly.
// Prevents 1-frame flicker where context hasn't hydrated yet.
function getActivePrefs(guestPrefs) {
    if (guestPrefs) return guestPrefs;
    try {
        const raw = localStorage.getItem('pb_guest_prefs');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export default function HomePage() {
    const { t } = useTranslation();
    const { currentUser, isGuest, guestPrefs } = useAuth();
    const { listings, loading, hasMore, refetch, loadMore } = useListings();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [stats, setStats] = useState({ farmers: '1,200', listings: '450' });
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const rowRefs = useRef({});

    const listingIds = listings.map(l => l.id);
    const { likedIds, toggleFavorite } = useFavorites(currentUser?.id, listingIds);

    const fetchStats = React.useCallback(async () => {
        try {
            const [listingRes, farmerRes] = await Promise.all([
                supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
            ]);
            if (listingRes.count !== null)
                setStats(s => ({ ...s, listings: listingRes.count.toLocaleString() }));
            if (farmerRes.count !== null)
                setStats(s => ({ ...s, farmers: farmerRes.count.toLocaleString() }));
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    useEffect(() => {
        (async () => { refetch(); await fetchStats(); })();
    }, [refetch, fetchStats]);

    // Auto-set the active tab based on category preference.
    // No isGuest check — works for guests AND logged-in users.
    useEffect(() => {
        const prefs = getActivePrefs(guestPrefs);
        startTransition(() => {
            if (prefs?.category === 'livestock') setActiveTab('all');
            if (prefs?.category === 'pets') setActiveTab('pets');
        });
    }, [guestPrefs?.category]); // eslint-disable-line react-hooks/exhaustive-deps

    const isBuyer = isGuest && guestPrefs?.role === 'buyer';

    async function handleLoadMore() {
        setLoadingMore(true);
        await loadMore();
        setLoadingMore(false);
    }

    // Single source of truth — sync read so frame-1 is always correct
    const activePrefs = getActivePrefs(guestPrefs);
    const isLivestock = activePrefs?.category === 'livestock';
    const isPets = activePrefs?.category === 'pets';

    // Master filtered list — used everywhere, never use raw listings[]
    const filteredListings = React.useMemo(() => {
        const prefs = getActivePrefs(guestPrefs);
        let result = [...listings];

        // Step 1 — category hard-filter
        if (prefs?.category === 'livestock') {
            result = result.filter(l => !PET_CATEGORIES.includes(l.category));
        } else if (prefs?.category === 'pets') {
            result = result.filter(l => PET_CATEGORIES.includes(l.category));
        }

        // Step 2 — active tab filter
        if (activeTab !== 'all') {
            if (activeTab === 'pets')
                result = result.filter(l => PET_CATEGORIES.includes(l.category));
            else if (activeTab === 'dogs')
                result = result.filter(l => l.category === 'dog');
            else if (activeTab === 'cats')
                result = result.filter(l => l.category === 'cat');
            else if (activeTab === 'birds')
                result = result.filter(l => l.category === 'bird');
            else
                result = result.filter(l => l.category === activeTab);
        }

        // Step 3 — search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                (l.title || '').toLowerCase().includes(q) ||
                (l.breed || '').toLowerCase().includes(q) ||
                (l.location || '').toLowerCase().includes(q) ||
                (l.category || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [listings, activeTab, searchQuery, guestPrefs]);

    // Pre-computed sublists for the "all" tab sections
    const newlyAdded = filteredListings.slice(0, 10);
    const petListings = filteredListings.filter(l => PET_CATEGORIES.includes(l.category));
    const cattleListings = filteredListings.filter(l => !PET_CATEGORIES.includes(l.category));

    function handleSearchKeyDown(e) {
        if (e.key === 'Enter' && searchQuery.trim())
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }

    function scrollRow(key, dir) {
        const row = rowRefs.current[key];
        if (row) row.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }

    function renderSkeletons(count = 4) {
        return Array.from({ length: count }).map((_, i) => (
            <div key={i} className="cs-card-wrapper"><SkeletonCard /></div>
        ));
    }

    function renderCard(listing) {
        return (
            <div key={listing.id} className="cs-card-wrapper">
                <ListingCard
                    listing={listing}
                    isLiked={likedIds.has(listing.id)}
                    onToggleFavorite={toggleFavorite}
                />
            </div>
        );
    }

    // Category strip — hide wrong-type tabs based on preference
    const visibleCategories = CATEGORIES.filter(c => {
        if (c.id === 'pets') return false; // Hide redundant "Pets" icon from top strip
        if (isLivestock) return !PET_TAB_IDS.includes(c.id);
        if (isPets) return PET_TAB_IDS.includes(c.id) || c.id === 'all';
        return true;
    });

    return (
        <div className="home-layout">
            <SEOHead
                title="Buy & Sell Cattle in India | Kosalai"
                description="India's trusted marketplace for cows, buffaloes, goats, horses and pets."
            />
            <div className="home-container">

                {/* HERO BANNER */}
                <div className="new-hero-banner">
                    <div className="nh-content">
                        <h1 className="nh-title">
                            {t('home.heroTitle')}<br />
                            <span className="nh-yellow">With Full Trust</span>
                        </h1>
                        <p className="nh-sub">
                            Connecting farmers across India with verified cattle listings.
                        </p>
                        <div className="nh-actions">
                            {!isBuyer && (
                                <button
                                    className="nh-btn-primary"
                                    onClick={() => navigate('/sell')}
                                >
                                    {t('home.getStarted')}
                                </button>
                            )}
                            <button
                                className="nh-btn-outline"
                                onClick={() => {
                                    document.querySelector('.category-strip')
                                        ?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                {t('home.howItWorks')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* STATS ROW */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="sc-icon gray">👥</div>
                        <div className="sc-info">
                            <div className="sc-val">{stats.farmers}</div>
                            <div className="sc-lbl">{t('home.registeredFarmers')}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="sc-icon yellow">🗂</div>
                        <div className="sc-info">
                            <div className="sc-val">{stats.listings}</div>
                            <div className="sc-lbl">{t('home.activeListings')}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="sc-icon green">🛡</div>
                        <div className="sc-info">
                            <div className="sc-val">100%</div>
                            <div className="sc-lbl">{t('home.aiVerified')}</div>
                        </div>
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'white', border: '1.5px solid #e5e7eb',
                    borderRadius: 14, padding: '10px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 8
                }}>
                    <span style={{ fontSize: 18 }}>🔍</span>
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search cow, buffalo, Gir, Murrah, Labrador…"
                        style={{
                            flex: 1, border: 'none', outline: 'none',
                            fontFamily: 'Nunito, sans-serif', fontSize: 14,
                            color: '#1a3c28', background: 'transparent'
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                background: 'none', border: 'none',
                                cursor: 'pointer', color: '#9ca3af',
                                fontSize: 16, padding: 4
                            }}
                        >✕</button>
                    )}
                    {searchQuery && (
                        <button
                            onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
                            style={{
                                background: '#1a7a3c', color: 'white',
                                border: 'none', borderRadius: 10,
                                padding: '6px 14px', cursor: 'pointer',
                                fontWeight: 700, fontSize: 13
                            }}
                        >{t('home.search')}</button>
                    )}
                </div>

                {/* CATEGORY STRIP — filtered by preference */}
                <div className="category-strip">
                    {visibleCategories.map(c => (
                        <div
                            key={c.id}
                            className={`cat-icon-card ${activeTab === c.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(c.id)}
                        >
                            <div className="cat-icon-circle">{c.emoji}</div>
                            <div className="cat-icon-lbl">{c.label}</div>
                        </div>
                    ))}
                </div>

                <div className="home-main-body">
                    <div className="listings-container">
                        {activeTab === 'all' ? (
                            <>
                                {/* NEWLY ADDED — uses filteredListings not raw listings */}
                                <div className="category-section">
                                    <div className="cs-header">
                                        <div className="cs-title-group">
                                            <div className="cs-icon-tag">⏳</div>
                                            <h2 className="cs-title">
                                                {isPets
                                                    ? 'NEWLY ADDED PETS'
                                                    : isLivestock
                                                        ? 'NEWLY ADDED CATTLE'
                                                        : 'NEWLY ADDED'}
                                            </h2>
                                        </div>
                                        <div className="cs-arrows">
                                            <button className="arrow-btn"
                                                onClick={() => scrollRow('new', -1)}>❮</button>
                                            <button className="arrow-btn"
                                                onClick={() => scrollRow('new', 1)}>❯</button>
                                        </div>
                                    </div>
                                    <div className="cs-row"
                                        ref={el => (rowRefs.current['new'] = el)}>
                                        {loading
                                            ? renderSkeletons(4)
                                            : newlyAdded.map(renderCard)}
                                    </div>
                                </div>

                                {/* CATTLE SECTIONS — hidden in pets mode */}
                                {!loading && !isPets && CATEGORIES
                                    .filter(c =>
                                        c.id !== 'all' &&
                                        c.id !== 'pets' &&
                                        !PET_TAB_IDS.includes(c.id)
                                    )
                                    .map(cat => {
                                        const catListings = cattleListings
                                            .filter(l => l.category === cat.id);
                                        if (catListings.length === 0) return null;
                                        return (
                                            <div key={cat.id} className="category-section">
                                                <div className="cs-header">
                                                    <div className="cs-title-group">
                                                        <div className="cs-icon-tag">
                                                            {cat.emoji}
                                                        </div>
                                                        <h2 className="cs-title"
                                                            style={{ textTransform: 'uppercase' }}>
                                                            {cat.label}S
                                                        </h2>
                                                    </div>
                                                    <button className="cs-view-all"
                                                        onClick={() => setActiveTab(cat.id)}>
                                                        <span className="eye-icon">👁</span> VIEW ALL
                                                    </button>
                                                    <div className="cs-arrows">
                                                        <button className="arrow-btn"
                                                            onClick={() => scrollRow(cat.id, -1)}>❮</button>
                                                        <button className="arrow-btn"
                                                            onClick={() => scrollRow(cat.id, 1)}>❯</button>
                                                    </div>
                                                </div>
                                                <div className="cs-row"
                                                    ref={el => (rowRefs.current[cat.id] = el)}>
                                                    {catListings.slice(0, 8).map(renderCard)}
                                                </div>
                                            </div>
                                        );
                                    })}

                                {/* PETS SECTION — hidden in livestock mode */}
                                {!loading && !isLivestock && petListings.length > 0 && (
                                    <div className="category-section">
                                        <div className="cs-header">
                                            <div className="cs-title-group">
                                                <div className="cs-icon-tag">🐾</div>
                                                <h2 className="cs-title">PETS &amp; OTHERS</h2>
                                            </div>
                                            <button className="cs-view-all"
                                                onClick={() => setActiveTab('pets')}>
                                                <span className="eye-icon">👁</span> VIEW ALL
                                            </button>
                                            <div className="cs-arrows">
                                                <button className="arrow-btn"
                                                    onClick={() => scrollRow('pets', -1)}>❮</button>
                                                <button className="arrow-btn"
                                                    onClick={() => scrollRow('pets', 1)}>❯</button>
                                            </div>
                                        </div>
                                        <div className="cs-row"
                                            ref={el => (rowRefs.current['pets'] = el)}>
                                            {petListings.map(renderCard)}
                                        </div>
                                    </div>
                                )}

                                {/* LOAD MORE */}
                                {!loading && hasMore && (
                                    <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            style={{
                                                padding: '12px 32px',
                                                background: '#1a7a3c', color: 'white',
                                                border: 'none', borderRadius: 12,
                                                fontWeight: 800, fontSize: 14,
                                                cursor: 'pointer',
                                                fontFamily: 'Nunito, sans-serif',
                                                opacity: loadingMore ? 0.7 : 1
                                            }}
                                        >
                                            {loadingMore ? 'Loading…' : '🔽 Load More'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* SPECIFIC CATEGORY TAB VIEW */
                            <div className="category-section">
                                <div className="cs-header">
                                    <div className="cs-title-group">
                                        <div className="cs-icon-tag">
                                            {CATEGORIES.find(c => c.id === activeTab)?.emoji}
                                        </div>
                                        <h2 className="cs-title"
                                            style={{ textTransform: 'uppercase' }}>
                                            {CATEGORIES.find(c => c.id === activeTab)?.label}{activeTab !== 'pets' && activeTab !== 'all' && 'S'}
                                        </h2>
                                    </div>
                                    <button className="cs-view-all"
                                        onClick={() => setActiveTab('all')}>
                                        ❮ BACK TO HOME
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="cards-grid">{renderSkeletons(6)}</div>
                                ) : filteredListings.length === 0 ? (
                                    <div className="ls-empty">
                                        No listings match this category.
                                    </div>
                                ) : (
                                    <div className="cards-grid">
                                        {filteredListings.map(listing => (
                                            <ListingCard
                                                key={listing.id}
                                                listing={listing}
                                                isLiked={likedIds.has(listing.id)}
                                                onToggleFavorite={toggleFavorite}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
