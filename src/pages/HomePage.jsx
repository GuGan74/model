import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useTranslation } from 'react-i18next';
import ListingCard from '../components/ListingCard';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import './HomePage.css';

const LIVESTOCK_CATEGORIES = [
    { id: 'all', emoji: '🎯', label: 'All' },
    { id: 'cow', emoji: '🐄', label: 'Cows' },
    { id: 'buffalo', emoji: '🦬', label: 'Buffalos' },
    { id: 'goat', emoji: '🐐', label: 'Goats' },
    { id: 'horse', emoji: '🐎', label: 'Horses' },
    { id: 'poultry', emoji: '🐓', label: 'Poultry' },
    { id: 'sheep', emoji: '🐑', label: 'Sheep' },
];

const PET_CATEGORIES = [
    { id: 'all', emoji: '🎯', label: 'All' },
    { id: 'dog', emoji: '🐕', label: 'Dogs' },
    { id: 'cat', emoji: '🐈', label: 'Cats' },
    { id: 'bird', emoji: '🐦', label: 'Birds' },
    { id: 'fish', emoji: '🐟', label: 'Fish' },
    { id: 'rabbit', emoji: '🐰', label: 'Rabbits' },
    { id: 'other-pet', emoji: '🐾', label: 'Other' },
];

const PET_IDS = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'other-pet'];

const INDIAN_STATES = [
    'Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana',
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Punjab', 'Haryana',
    'Uttar Pradesh', 'Bihar', 'West Bengal', 'Odisha', 'Madhya Pradesh',
    'Assam', 'Jharkhand', 'Uttarakhand', 'Himachal Pradesh', 'Chhattisgarh',
    'Goa', 'Tripura', 'Meghalaya', 'Manipur', 'Arunachal Pradesh',
    'Delhi', 'Jammu & Kashmir', 'Puducherry',
];

const DEMO_LISTINGS = [
    { id: 'd1', title: 'HF Cow — High Milk Yield', category: 'cow', breed: 'HF Holstein', age_years: 4, price: 65000, location: 'Coimbatore', state: 'Tamil Nadu', milk_yield_liters: 18, is_vaccinated: true, is_verified: true, is_pregnant: true, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'female', created_at: new Date().toISOString() },
    { id: 'd2', title: 'Murrah Buffalo — Milk Breed', category: 'buffalo', breed: 'Murrah', age_years: 5, price: 85000, location: 'Amreli', state: 'Gujarat', milk_yield_liters: 14, is_vaccinated: true, is_verified: true, is_pregnant: false, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'female', created_at: new Date().toISOString() },
    { id: 'd3', title: 'Boer Goat — Meat Breed', category: 'goat', breed: 'Boer', age_years: 2, price: 12000, location: 'Pune', state: 'Maharashtra', milk_yield_liters: null, is_vaccinated: false, is_verified: false, is_pregnant: false, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'male', created_at: new Date().toISOString() },
    { id: 'd4', title: 'Gir Cow — A2 Milk', category: 'cow', breed: 'Gir', age_years: 3, price: 48000, location: 'Junagadh', state: 'Gujarat', milk_yield_liters: 12, is_vaccinated: true, is_verified: true, is_pregnant: true, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'female', created_at: new Date().toISOString() },
    { id: 'd5', title: 'Labrador Retriever Puppy', category: 'dog', breed: 'Labrador', age_years: 0.3, price: 15000, location: 'Chennai', state: 'Tamil Nadu', is_vaccinated: true, is_verified: true, is_pregnant: false, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'male', created_at: new Date().toISOString() },
    { id: 'd6', title: 'Persian Cat — Ready for Adoption', category: 'cat', breed: 'Persian', age_years: 1, price: 8000, location: 'Bengaluru', state: 'Karnataka', is_vaccinated: true, is_verified: false, is_pregnant: false, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'female', created_at: new Date().toISOString() },
];

export default function HomePage() {
    const { t } = useTranslation();
    const { currentUser, listingType } = useAuth();
    const navigate = useNavigate();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedState, setSelectedState] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [searchQuery, setSearchQuery] = useState('');

    const listingIds = listings.map(l => l.id);
    const { likedIds, toggleFavorite } = useFavorites(currentUser?.id, listingIds);

    const categories = listingType === 'livestock' ? LIVESTOCK_CATEGORIES : PET_CATEGORIES;

    const LIVESTOCK_IDS = ['cow', 'buffalo', 'goat', 'sheep', 'horse', 'poultry'];

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('listings')
                .select('*')
                .eq('status', 'active');

            if (listingType === 'livestock') {
                query = query.in('category', LIVESTOCK_IDS);
            } else {
                query = query.in('category', PET_IDS);
            }

            if (selectedState !== 'all') {
                query = query.eq('state', selectedState);
            }

            if (sortBy === 'recent') {
                query = query.order('created_at', { ascending: false });
            } else if (sortBy === 'price_low') {
                query = query.order('price', { ascending: true });
            } else if (sortBy === 'price_high') {
                query = query.order('price', { ascending: false });
            }

            const { data, error } = await query.limit(60);
            if (error) throw error;

            const fetched = data || [];
            // Supplement with demo data if empty
            if (fetched.length === 0) {
                const demoFiltered = listingType === 'livestock'
                    ? DEMO_LISTINGS.filter(l => !PET_IDS.includes(l.category))
                    : DEMO_LISTINGS.filter(l => PET_IDS.includes(l.category));
                setListings(demoFiltered);
            } else {
                setListings(fetched);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            const demoFiltered = listingType === 'livestock'
                ? DEMO_LISTINGS.filter(l => !PET_IDS.includes(l.category))
                : DEMO_LISTINGS.filter(l => PET_IDS.includes(l.category));
            setListings(demoFiltered);
        } finally {
            setLoading(false);
        }
    }, [listingType, selectedState, sortBy]);

    useEffect(() => {
        setActiveTab('all'); // Reset category on type switch
        fetchListings();
    }, [fetchListings]);

    const filteredListings = React.useMemo(() => {
        let result = [...listings];

        if (activeTab !== 'all') {
            result = result.filter(l => l.category === activeTab);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                (l.title || '').toLowerCase().includes(q) ||
                (l.breed || '').toLowerCase().includes(q) ||
                (l.location || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [listings, activeTab, searchQuery]);

    function handleSearchKeyDown(e) {
        if (e.key === 'Enter' && searchQuery.trim())
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }

    return (
        <div className="home-layout">
            <SEOHead
                title="Buy & Sell Cattle in India | Kosalai"
                description="India's trusted marketplace for cows, buffaloes, goats, horses and pets."
            />
            <div className="home-container">

                {/* SEARCH + STATE FILTER ROW */}
                <div className="hp-top-row">
                    <div className="hp-search-box">
                        <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder={listingType === 'livestock'
                                ? 'Search cow, buffalo, Gir, Murrah…'
                                : 'Search dog, cat, Labrador, Persian…'}
                            className="hp-search-input"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="hp-search-clear">✕</button>
                        )}
                    </div>
                    <select
                        value={selectedState}
                        onChange={e => setSelectedState(e.target.value)}
                        className="hp-state-select"
                    >
                        <option value="all">All States</option>
                        {INDIAN_STATES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* CATEGORY TABS */}
                <div className="hp-category-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`hp-cat-tab${activeTab === cat.id ? ' active' : ''}`}
                            onClick={() => setActiveTab(cat.id)}
                        >
                            <span>{cat.emoji}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* SORT / FILTER CONTROL BAR — filter LEFT, sort RIGHT */}
                <div className="hp-controls-bar">
                    <button className="hp-filter-btn" onClick={() => navigate('/search')}>
                        🎛️ Filters
                    </button>
                    <div className="hp-sort-group">
                        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Sort:</span>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="hp-sort-select">
                            <option value="recent">Recently Added</option>
                            <option value="price_low">Price: Low → High</option>
                            <option value="price_high">Price: High → Low</option>
                        </select>
                    </div>
                </div>

                {/* LISTINGS 2×2 GRID */}
                {loading ? (
                    <div className="hp-grid">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                        <div style={{ fontSize: 60, marginBottom: 16 }}>
                            {listingType === 'livestock' ? '🐄' : '🐾'}
                        </div>
                        <h3 style={{ color: '#374151' }}>No listings found</h3>
                        <p style={{ fontSize: 14 }}>Try a different category or state filter</p>
                    </div>
                ) : (
                    <div className="hp-grid">
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
        </div>
    );
}
