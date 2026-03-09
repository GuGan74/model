import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import './MyListingsPage.css';

const DEMO = [
    { id: 'd1', title: 'HF Cow — High Milk Yield', category: 'cow', breed: 'HF Holstein', age_years: 4, price: 65000, location: 'Coimbatore', state: 'Tamil Nadu', milk_yield_liters: 18, is_vaccinated: true, is_verified: true, is_pregnant: true, is_promoted: true, for_adoption: false, image_url: null, status: 'active', created_at: new Date().toISOString() },
    { id: 'd2', title: 'Gir Heifer Cow', category: 'cow', breed: 'Gir', age_years: 3, price: 48000, location: 'Amreli', state: 'Gujarat', milk_yield_liters: 12, is_vaccinated: true, is_verified: true, is_pregnant: false, is_promoted: false, for_adoption: false, image_url: null, status: 'pending', created_at: new Date().toISOString() },
];

export default function MyListingsPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('active');

    const fetchMyListings = React.useCallback(async () => {
        if (!currentUser || currentUser.id.startsWith('demo')) {
            setListings(DEMO);
            setLoading(false);
            return;
        }
        const { data } = await supabase.from('listings').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setListings(data || DEMO);
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        (async () => { await fetchMyListings(); })();
    }, [fetchMyListings]);

    const filtered = listings.filter(l => l.status === tab);

    return (
        <div className="myl-wrap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 22, fontWeight: 900 }}>📋 My Listings</h2>
                <button className="btn-primary" onClick={() => navigate('/sell')}>+ Post New</button>
            </div>

            <div className="myl-tabs">
                {[['active', 'Active', 'green'], ['pending', 'Pending', 'orange'], ['sold', 'Sold', '']].map(([id, label, color]) => {
                    const count = listings.filter(l => l.status === id).length;
                    return (
                        <button key={id} className={`myl-tab${tab === id ? ' act' : ''}${color === 'orange' ? ' or' : ''}`} onClick={() => setTab(id)}>
                            {label}
                            {count > 0 && <span className={`tbdg${color === 'orange' ? ' or' : ''}`}>{count}</span>}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner dark" style={{ margin: '0 auto' }} /></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--g3)' }}>
                    <div style={{ fontSize: 60 }}>📋</div>
                    <h3 style={{ marginTop: 12, color: 'var(--g1)' }}>No {tab} listings</h3>
                    {tab === 'active' && <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/sell')}>Post Your First Listing</button>}
                </div>
            ) : (
                <div className="myl-grid">
                    {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>
            )}
        </div>
    );
}
