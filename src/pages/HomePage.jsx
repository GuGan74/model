import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ListingCard from '../components/ListingCard';
import './HomePage.css';

// Fallback demo listings for when DB is empty or in demo mode
const DEMO_LISTINGS = [
    { id: 'd1', title: 'Pure Gir Cow', category: 'cow', breed: 'Gir', age_years: 4, price: 65000, location: 'Coimbatore', state: 'Tamil Nadu', milk_yield_liters: 13, is_vaccinated: true, for_adoption: false, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Gir_cattle.jpg/480px-Gir_cattle.jpg', created_at: new Date().toISOString() },
    { id: 'd2', title: 'Murrah Buffalo', category: 'buffalo', breed: 'Murrah', age_years: 5, price: 85000, location: 'Ludhiana', state: 'Punjab', milk_yield_liters: 18, is_vaccinated: true, for_adoption: false, image_url: null, created_at: new Date().toISOString() },
    { id: 'd3', title: 'Barbari Goat', category: 'goat', breed: 'Barbari', age_years: 2, price: 12400, location: 'Jaipur', state: 'Rajasthan', milk_yield_liters: null, is_vaccinated: false, for_adoption: false, image_url: null, created_at: new Date().toISOString() },
    { id: 'd4', title: 'HF Pure Breed', category: 'cow', breed: 'HF', age_years: 3.5, price: 120000, location: 'Anand', state: 'Gujarat', milk_yield_liters: 28, is_vaccinated: true, for_adoption: false, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Cow_female_black_white.jpg/480px-Cow_female_black_white.jpg', created_at: new Date().toISOString() },
    { id: 'd5', title: 'Marwari Sheep', category: 'sheep', breed: 'Marwari', age_years: 1.5, price: 18500, location: 'Jodhpur', state: 'Rajasthan', milk_yield_liters: null, is_vaccinated: true, for_adoption: false, image_url: null, created_at: new Date().toISOString() },
    { id: 'd6', title: 'Sahiwal Bull', category: 'cow', breed: 'Sahiwal', age_years: 4, price: 72000, location: 'Hisar', state: 'Haryana', milk_yield_liters: null, is_vaccinated: true, for_adoption: false, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Sahiwal_cow.jpg/480px-Sahiwal_cow.jpg', created_at: new Date().toISOString() }
];

const CATEGORIES = [
    { id: 'all', emoji: '🎛️', label: 'All Animals' },
    { id: 'cow', emoji: '🐄', label: 'Cow' },
    { id: 'buffalo', emoji: '🦬', label: 'Buffalo' },
    { id: 'goat', emoji: '🐐', label: 'Goat' },
    { id: 'sheep', emoji: '🐑', label: 'Sheep' },
    { id: 'poultry', emoji: '🐓', label: 'Poultry' },
    { id: 'pets', emoji: '🐾', label: 'Pets' },
    { id: 'dogs', emoji: '🐕', label: 'Dogs' },
    { id: 'cats', emoji: '🐈', label: 'Cats' },
    { id: 'birds', emoji: '🦜', label: 'Birds' },
];

const SESSION_KEY = 'pb_listings_cache';

export default function HomePage() {
    // Pre-populate with cached or demo data so the UI is never blank
    const cachedRaw = sessionStorage.getItem(SESSION_KEY);
    const initialListings = cachedRaw ? JSON.parse(cachedRaw) : DEMO_LISTINGS;

    const [listings, setListings] = useState(initialListings);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(!cachedRaw); // skip spinner if we have cache
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery] = useState('');
    const [stats, setStats] = useState({ farmers: '1,200', listings: '450' });

    const [filters] = useState({ types: [], priceMin: 0, priceMax: 999999 });
    const [sort] = useState('newest');

    useEffect(() => {
        // Run both fetches in parallel
        Promise.all([fetchListings(), fetchStats()]);
    }, []);

    async function fetchStats() {
        try {
            // Fetch both counts in parallel
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

    async function fetchListings() {
        // Only show loading spinner if we have no cache
        const hasCachedData = Boolean(sessionStorage.getItem(SESSION_KEY));
        if (!hasCachedData) setLoading(true);
        try {
            // Race the DB query against a 5-second timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 5000)
            );
            const queryPromise = supabase
                .from('listings')
                .select('id,title,category,breed,age_years,price,location,state,milk_yield_liters,is_vaccinated,is_promoted,for_adoption,image_url,created_at')
                .eq('status', 'active')
                .limit(100);

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            let allListings = [];
            if (error || !data || data.length === 0) {
                allListings = DEMO_LISTINGS;
            } else {
                allListings = data.length > 3 ? data : [...data, ...DEMO_LISTINGS.slice(data.length)];
            }

            // Sort: Promoted > Vaccinated > Newest
            allListings.sort((a, b) => {
                if (a.is_promoted && !b.is_promoted) return -1;
                if (!a.is_promoted && b.is_promoted) return 1;
                if (a.is_vaccinated && !b.is_vaccinated) return -1;
                if (!a.is_vaccinated && b.is_vaccinated) return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });

            // Cache for instant revisits within the same session
            try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(allListings)); } catch (_) { }
            setListings(allListings);
        } catch (err) {
            console.error('Error fetching listings:', err);
            if (!hasCachedData) setListings(DEMO_LISTINGS);
        } finally {
            setLoading(false);
        }
    }

    // Apply filtering logic
    useEffect(() => {
        let result = [...listings];

        if (activeTab !== 'all') {
            if (activeTab === 'pets') {
                result = result.filter(l => ['dog', 'cat', 'bird'].includes(l.category));
            } else if (activeTab === 'dogs') {
                result = result.filter(l => l.category === 'dog');
            } else if (activeTab === 'cats') {
                result = result.filter(l => l.category === 'cat');
            } else if (activeTab === 'birds') {
                result = result.filter(l => l.category === 'bird');
            } else {
                result = result.filter(l => l.category === activeTab);
            }
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l => (l.title || '').toLowerCase().includes(q) || (l.location || '').toLowerCase().includes(q));
        }

        if (filters.types.length > 0) {
            result = result.filter(l => filters.types.includes(l.category));
        }

        if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
        else {
            // Default newest sort also respects priority
            result.sort((a, b) => {
                if (a.is_promoted && !b.is_promoted) return -1;
                if (!a.is_promoted && b.is_promoted) return 1;
                if (a.is_vaccinated && !b.is_vaccinated) return -1;
                if (!a.is_vaccinated && b.is_vaccinated) return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
        }

        // Price Filter Logic
        if (filters.priceMax < 999999 || filters.priceMin > 0) {
            result = result.filter(l => l.price >= filters.priceMin && l.price <= filters.priceMax);
        }

        setFiltered(result);
    }, [listings, activeTab, searchQuery, filters, sort]);


    return (
        <div className="home-layout">

            <div className="home-container">
                {/* HERO BANNER SECTION */}
                <div className="new-hero-banner">
                    <div className="nh-content">
                        <h1 className="nh-title">Buy &amp; Sell Cattle<br /><span className="nh-yellow">With Full Trust</span></h1>
                        <p className="nh-sub">Connecting farmers across India with verified livestock listings. Every animal is health-checked and documented.</p>

                        <div className="nh-actions">
                            <button className="nh-btn-primary">Get Started</button>
                            <button className="nh-btn-outline">How It Works</button>
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

                {/* CATEGORY ICON STRIP */}
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

                    {/* Redesigned Listings Sections */}
                    <div className="listings-container">
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div className="spinner dark" style={{ margin: '0 auto' }} />
                                <p style={{ marginTop: '12px', color: 'var(--g3)' }}>Loading amazing livestock for you...</p>
                            </div>
                        ) : activeTab === 'all' ? (
                            <>
                                {/* NEWLY ADDED LIVESTOCK */}
                                <div className="category-section">
                                    <div className="cs-header">
                                        <div className="cs-title-group">
                                            <div className="cs-icon-tag">⏳</div>
                                            <h2 className="cs-title">NEWLY ADDED LIVESTOCK</h2>
                                        </div>
                                        <div className="cs-arrows">
                                            <button className="arrow-btn" onClick={(e) => {
                                                const row = e.target.closest('.category-section').querySelector('.cs-row');
                                                row.scrollBy({ left: -300, behavior: 'smooth' });
                                            }}>❮</button>
                                            <button className="arrow-btn" onClick={(e) => {
                                                const row = e.target.closest('.category-section').querySelector('.cs-row');
                                                row.scrollBy({ left: 300, behavior: 'smooth' });
                                            }}>❯</button>
                                        </div>
                                    </div>
                                    <div className="cs-row">
                                        {listings.slice(0, 10).map(listing => (
                                            <div key={listing.id} className="cs-card-wrapper">
                                                <ListingCard listing={listing} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CATEGORY SPECIFIC SECTIONS */}
                                {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'pets').map(cat => {
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
                                                    <button className="arrow-btn" onClick={(e) => {
                                                        const row = e.target.closest('.category-section').querySelector('.cs-row');
                                                        row.scrollBy({ left: -300, behavior: 'smooth' });
                                                    }}>❮</button>
                                                    <button className="arrow-btn" onClick={(e) => {
                                                        const row = e.target.closest('.category-section').querySelector('.cs-row');
                                                        row.scrollBy({ left: 300, behavior: 'smooth' });
                                                    }}>❯</button>
                                                </div>
                                            </div>
                                            <div className="cs-row">
                                                {catListings.slice(0, 8).map(listing => (
                                                    <div key={listing.id} className="cs-card-wrapper">
                                                        <ListingCard listing={listing} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* PETS SECTION */}
                                {(() => {
                                    const petListings = listings.filter(l => ['dog', 'cat', 'bird'].includes(l.category));
                                    if (petListings.length === 0) return null;
                                    return (
                                        <div className="category-section">
                                            <div className="cs-header">
                                                <div className="cs-title-group">
                                                    <div className="cs-icon-tag">🐾</div>
                                                    <h2 className="cs-title">PETS & OTHERS</h2>
                                                </div>
                                                <button className="cs-view-all" onClick={() => setActiveTab('pets')}>
                                                    <span className="eye-icon">👁</span> VIEW ALL
                                                </button>
                                                <div className="cs-arrows">
                                                    <button className="arrow-btn" onClick={(e) => {
                                                        const row = e.target.closest('.category-section').querySelector('.cs-row');
                                                        row.scrollBy({ left: -300, behavior: 'smooth' });
                                                    }}>❮</button>
                                                    <button className="arrow-btn" onClick={(e) => {
                                                        const row = e.target.closest('.category-section').querySelector('.cs-row');
                                                        row.scrollBy({ left: 300, behavior: 'smooth' });
                                                    }}>❯</button>
                                                </div>
                                            </div>
                                            <div className="cs-row">
                                                {petListings.map(listing => (
                                                    <div key={listing.id} className="cs-card-wrapper">
                                                        <ListingCard listing={listing} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
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
                                {filtered.length === 0 ? (
                                    <div className="ls-empty">No listings match this category.</div>
                                ) : (
                                    <div className="cards-grid">
                                        {filtered.map(listing => (
                                            <ListingCard key={listing.id} listing={listing} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}
