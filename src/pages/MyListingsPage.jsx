import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import toast from 'react-hot-toast';
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

    async function markSold(id) {
        if (!window.confirm('Mark this listing as sold?')) return;
        await supabase.from('listings').update({ status: 'sold' }).eq('id', id);
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l));
        toast.success('Marked as sold! 🎉');
    }

    async function deleteListing(id) {
        if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
        await supabase.from('listings').delete().eq('id', id);
        setListings(prev => prev.filter(l => l.id !== id));
        toast.success('Listing deleted');
    }

    async function relistListing(id) {
        await supabase.from('listings').update({ status: 'active' }).eq('id', id);
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l));
        toast.success('Listing relisted! ✓');
    }

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
                    {filtered.map(l => (
                        <div key={l.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <ListingCard listing={l} />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                {l.status === 'active' && (
                                    <>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20 }} onClick={() => navigate('/sell', { state: { editListing: l } })}>✏️ Edit</button>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20, color: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => markSold(l.id)}>✅ Mark Sold</button>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20, color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => deleteListing(l.id)}>🗑️ Delete</button>
                                    </>
                                )}
                                {l.status === 'pending' && (
                                    <>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20 }} onClick={() => navigate('/sell', { state: { editListing: l } })}>✏️ Edit</button>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20, color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => deleteListing(l.id)}>🗑️ Delete</button>
                                    </>
                                )}
                                {l.status === 'sold' && (
                                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20, color: 'var(--blue)', borderColor: 'var(--blue)' }} onClick={() => relistListing(l.id)}>🔄 Relist</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
