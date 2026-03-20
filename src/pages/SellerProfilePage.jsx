import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BackButton from '../components/BackButton';
import ListingCard from '../components/ListingCard';

const DEMO_SELLER = {
    id: 'demo-seller',
    full_name: 'Rajan Kumar',
    phone: '9876543210',
    email: 'rajan@example.com',
    location: 'Coimbatore, Tamil Nadu',
    created_at: new Date(Date.now() - 365 * 24 * 3600000).toISOString(),
};

const DEMO_SELLER_LISTINGS = [
    { id: 'd1', title: 'HF Cow — High Milk Yield', category: 'cow', breed: 'HF Holstein', age_years: 4, price: 65000, location: 'Coimbatore', state: 'Tamil Nadu', milk_yield_liters: 18, is_vaccinated: true, is_verified: true, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'female', created_at: new Date().toISOString() },
    { id: 'd2', title: 'Gir Cow — A2 Milk', category: 'cow', breed: 'Gir', age_years: 3, price: 48000, location: 'Coimbatore', state: 'Tamil Nadu', milk_yield_liters: 12, is_vaccinated: true, is_verified: false, is_promoted: false, for_adoption: false, image_url: null, status: 'active', gender: 'female', created_at: new Date().toISOString() },
];

export default function SellerProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [seller, setSeller] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            // Demo mode fallback
            if (!userId || userId.startsWith('demo')) {
                setSeller(DEMO_SELLER);
                setListings(DEMO_SELLER_LISTINGS);
                setLoading(false);
                return;
            }
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                setSeller(profile || DEMO_SELLER);

                const { data: listingsData } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                setListings(listingsData || []);
            } catch (err) {
                console.error('Seller fetch error:', err);
                setSeller(DEMO_SELLER);
                setListings(DEMO_SELLER_LISTINGS);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [userId]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner dark" style={{ margin: '0 auto' }} />
        </div>
    );

    if (!seller) return (
        <div style={{ textAlign: 'center', padding: 40 }}>
            Seller not found. <button onClick={() => navigate('/')}>Go Home</button>
        </div>
    );

    const initials = (seller.full_name || seller.phone || 'S').slice(0, 2).toUpperCase();
    const phone = (seller.phone || '').replace(/\D/g, '').replace(/^91/, '');
    const memberYear = new Date(seller.created_at || Date.now()).getFullYear();

    return (
        <div className="seller-profile-page">
            <BackButton fallbackPath="/" />

            {/* Hero Card */}
            <div className="seller-hero-card">
                <div className="seller-avatar-circle">{initials}</div>
                <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', fontFamily: 'Poppins,sans-serif' }}>
                    {seller.full_name || 'Verified Seller'}
                </h1>
                <p style={{ opacity: 0.8, fontSize: 13, margin: 0 }}>
                    Member since {memberYear} · {listings.length} active listing{listings.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Contact Info */}
            <div className="seller-contact-card">
                <h3 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, marginBottom: 8, color: '#1a3c28' }}>
                    📋 Contact Information
                </h3>

                {seller.phone && (
                    <div className="seller-contact-item">
                        <span>📱</span>
                        <span style={{ color: '#6B7280', fontWeight: 600 }}>Phone:</span>
                        <a href={`tel:${seller.phone}`} style={{ color: '#1a7a3c', fontWeight: 700, textDecoration: 'none' }}>
                            +91 {seller.phone}
                        </a>
                    </div>
                )}

                {seller.email && (
                    <div className="seller-contact-item">
                        <span>📧</span>
                        <span style={{ color: '#6B7280', fontWeight: 600 }}>Email:</span>
                        <a href={`mailto:${seller.email}`} style={{ color: '#1a7a3c', fontWeight: 700, textDecoration: 'none' }}>
                            {seller.email}
                        </a>
                    </div>
                )}

                {seller.location && (
                    <div className="seller-contact-item">
                        <span>📍</span>
                        <span style={{ color: '#6B7280', fontWeight: 600 }}>Location:</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{seller.location}</span>
                    </div>
                )}


            </div>

            {/* Seller Listings */}
            <div>
                <h2 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, marginBottom: 16, color: '#1a3c28', fontSize: 18 }}>
                    🐄 Active Listings ({listings.length})
                </h2>

                {listings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                        <div style={{ fontSize: 48 }}>📭</div>
                        <p>No active listings from this seller</p>
                    </div>
                ) : (
                    <div className="seller-listings-grid">
                        {listings.map(l => <ListingCard key={l.id} listing={l} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
