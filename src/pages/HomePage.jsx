import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import { CATEGORIES } from '../constants/index';
import ListingCard from '../components/ListingCard';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import './HomePage.css';

export default function HomePage() {
    const { currentUser } = useAuth();
    const { listings, loading, hasMore, refetch, loadMore } = useListings();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [filtered, setFiltered] = useState([]);
    const [stats, setStats] = useState({ farmers: '1,200', listings: '450' });
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Refs for scroll rows (instead of DOM traversal)
    const rowRefs = useRef({});

    // Batch-fetch all liked IDs in one query (no N+1)
    const listingIds = listings.map(l => l.id);
    const { likedIds, toggleFavorite } = useFavorites(currentUser?.id, listingIds);

    useEffect(() => {
        refetch();
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const [listingRes, farmerRes] = await Promise.all([
                supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
            ]);
            if (listingRes.count !== null) setStats(s => ({ ...s, listings: listingRes.count.toLocaleString() }));
            if (farmerRes.count !== null) setStats(s => ({ ...s, farmers: farmerRes.count.toLocaleString() }));
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }

    async function handleLoadMore() {
        setLoadingMore(true);
        await loadMore();
        setLoadingMore(false);
    }

    // Filtering logic — includes live search query
    useEffect(() => {
        let result = [...listings];
        if (activeTab !== 'all') {
            if (activeTab === 'pets') result = result.filter(l => ['dog', 'cat', 'bird'].includes(l.category));
            else if (activeTab === 'dogs') result = result.filter(l => l.category === 'dog');
            else if (activeTab === 'cats') result = result.filter(l => l.category === 'cat');
            else if (activeTab === 'birds') result = result.filter(l => l.category === 'bird');
            else result = result.filter(l => l.category === activeTab);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                (l.title || '').toLowerCase().includes(q) ||
                (l.breed || '').toLowerCase().includes(q) ||
                (l.location || '').toLowerCase().includes(q) ||
                (l.category || '').toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [listings, activeTab, searchQuery]);

    function handleSearchKeyDown(e) {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    }

    function scrollRow(key, dir) {
        const row = rowRefs.current[key];
        if (row) row.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }

    function renderSkeletons(count = 4) {
        return Array.from({ length: count }).map((_, i) => (
            <div key={i} className="cs-card-wrapper">
                <SkeletonCard />
            </div>
        ));
    }

    return (
        <div className="home-layout">
            <SEOHead
                title="Buy & Sell Cattle in India | PashuBazaar"
                description="India's trusted marketplace for cows, buffaloes, goats, sheep and pets. Verified listings from farmers across Tamil Nadu, Punjab, Haryana and more."
            />
            <div className="home-container">
                {/* HERO BANNER */}
                <div className="new-hero-banner">
                    <div className="nh-content">
                        <h1 className="nh-title">Buy &amp; Sell Cattle<br /><span className="nh-yellow">With Full Trust</span></h1>
                        <p className="nh-sub">Connecting farmers across India with verified livestock listings. Every animal is health-checked and documented.</p>
                        <div className="nh-actions">
                            <button
                                className="nh-btn-primary"
                                onClick={() => navigate('/sell')}
                            >
                                Get Started
                            </button>
                            <button
                                className="nh-btn-outline"
                                onClick={() => {
                                    document.querySelector('.category-strip')
                                        ?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                How It Works
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
                            <div className="sc-lbl">Registered Farmers</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="sc-icon yellow">🗂</div>
                        <div className="sc-info">
                            <div className="sc-val">{stats.listings}</div>
                            <div className="sc-lbl">Active Listings</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="sc-icon green">🛡</div>
                        <div className="sc-info">
                            <div className="sc-val">100%</div>
                            <div className="sc-lbl">ML Verified</div>
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
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: 4
                            }}
                            title="Clear search"
                        >✕</button>
                    )}
                    {searchQuery && (
                        <button
                            onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
                            style={{
                                background: '#1a7a3c', color: 'white', border: 'none',
                                borderRadius: 10, padding: '6px 14px', cursor: 'pointer',
                                fontWeight: 700, fontFamily: 'Nunito, sans-serif', fontSize: 13
                            }}
                        >Search</button>
                    )}
                </div>

                {/* CATEGORY STRIP */}
                <div className="category-strip">
                    {CATEGORIES.map(c => (
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
                                {/* NEWLY ADDED LIVESTOCK */}
                                <div className="category-section">
                                    <div className="cs-header">
                                        <div className="cs-title-group">
                                            <div className="cs-icon-tag">⏳</div>
                                            <h2 className="cs-title">NEWLY ADDED LIVESTOCK</h2>
                                        </div>
                                        <div className="cs-arrows">
                                            <button className="arrow-btn" onClick={() => scrollRow('new', -1)}>❮</button>
                                            <button className="arrow-btn" onClick={() => scrollRow('new', 1)}>❯</button>
                                        </div>
                                    </div>
                                    <div className="cs-row" ref={el => (rowRefs.current['new'] = el)}>
                                        {loading
                                            ? renderSkeletons(4)
                                            : listings.slice(0, 10).map(listing => (
                                                <div key={listing.id} className="cs-card-wrapper">
                                                    <ListingCard
                                                        listing={listing}
                                                        isLiked={likedIds.has(listing.id)}
                                                        onToggleFavorite={toggleFavorite}
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* CATEGORY-SPECIFIC SECTIONS */}
                                {!loading && CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'pets').map(cat => {
                                    const catListings = listings.filter(l => l.category === cat.id);
                                    if (catListings.length === 0) return null;
                                    return (
                                        <div key={cat.id} className="category-section">
                                            <div className="cs-header">
                                                <div className="cs-title-group">
                                                    <div className="cs-icon-tag">{cat.emoji}</div>
                                                    <h2 className="cs-title" style={{ textTransform: 'uppercase' }}>{cat.label}S</h2>
                                                </div>
                                                <button className="cs-view-all" onClick={() => setActiveTab(cat.id)}>
                                                    <span className="eye-icon">👁</span> VIEW ALL
                                                </button>
                                                <div className="cs-arrows">
                                                    <button className="arrow-btn" onClick={() => scrollRow(cat.id, -1)}>❮</button>
                                                    <button className="arrow-btn" onClick={() => scrollRow(cat.id, 1)}>❯</button>
                                                </div>
                                            </div>
                                            <div className="cs-row" ref={el => (rowRefs.current[cat.id] = el)}>
                                                {catListings.slice(0, 8).map(listing => (
                                                    <div key={listing.id} className="cs-card-wrapper">
                                                        <ListingCard
                                                            listing={listing}
                                                            isLiked={likedIds.has(listing.id)}
                                                            onToggleFavorite={toggleFavorite}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* PETS SECTION */}
                                {!loading && (() => {
                                    const petListings = listings.filter(l => ['dog', 'cat', 'bird'].includes(l.category));
                                    if (petListings.length === 0) return null;
                                    return (
                                        <div className="category-section">
                                            <div className="cs-header">
                                                <div className="cs-title-group">
                                                    <div className="cs-icon-tag">🐾</div>
                                                    <h2 className="cs-title">PETS &amp; OTHERS</h2>
                                                </div>
                                                <button className="cs-view-all" onClick={() => setActiveTab('pets')}>
                                                    <span className="eye-icon">👁</span> VIEW ALL
                                                </button>
                                                <div className="cs-arrows">
                                                    <button className="arrow-btn" onClick={() => scrollRow('pets', -1)}>❮</button>
                                                    <button className="arrow-btn" onClick={() => scrollRow('pets', 1)}>❯</button>
                                                </div>
                                            </div>
                                            <div className="cs-row" ref={el => (rowRefs.current['pets'] = el)}>
                                                {petListings.map(listing => (
                                                    <div key={listing.id} className="cs-card-wrapper">
                                                        <ListingCard
                                                            listing={listing}
                                                            isLiked={likedIds.has(listing.id)}
                                                            onToggleFavorite={toggleFavorite}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* LOAD MORE */}
                                {!loading && hasMore && (
                                    <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            style={{
                                                padding: '12px 32px', background: '#1a7a3c', color: 'white',
                                                border: 'none', borderRadius: 12, fontWeight: 800,
                                                fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                                                opacity: loadingMore ? 0.7 : 1
                                            }}
                                        >
                                            {loadingMore ? 'Loading…' : '🔽 Load More'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* GRID VIEW FOR SPECIFIC CATEGORY */
                            <div className="category-section">
                                <div className="cs-header">
                                    <div className="cs-title-group">
                                        <div className="cs-icon-tag">
                                            {CATEGORIES.find(c => c.id === activeTab)?.emoji}
                                        </div>
                                        <h2 className="cs-title" style={{ textTransform: 'uppercase' }}>
                                            {CATEGORIES.find(c => c.id === activeTab)?.label}S
                                        </h2>
                                    </div>
                                    <button className="cs-view-all" onClick={() => setActiveTab('all')}>
                                        ❮ BACK TO HOME
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="cards-grid">{renderSkeletons(6)}</div>
                                ) : filtered.length === 0 ? (
                                    <div className="ls-empty">No listings match this category.</div>
                                ) : (
                                    <div className="cards-grid">
                                        {filtered.map(listing => (
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
