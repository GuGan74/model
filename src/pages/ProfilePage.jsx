import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ListingCard from '../components/ListingCard';
import toast from 'react-hot-toast';
import './ProfilePage.css';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { currentProfile, signOut, currentUser } = useAuth();
    const p = currentProfile || {};
    const initials = (p.full_name || 'U').slice(0, 2).toUpperCase();
    const yr = new Date(p.created_at || Date.now()).getFullYear();

    const [likedListings, setLikedListings] = useState([]);
    const [loadingLiked, setLoadingLiked] = useState(true);
    const [stats, setStats] = useState({ listings: 0, views: 0, inquiries: 0, sold: 0 });

    const fetchStats = React.useCallback(async () => {
        if (!currentUser) return;
        try {
            const [listingsRes, inquiriesRes, soldRes] = await Promise.all([
                supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
                supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('type', 'inquiry'),
                supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('status', 'sold')
            ]);

            setStats({
                listings: listingsRes.count || 0,
                inquiries: inquiriesRes.count || 0,
                sold: soldRes.count || 0,
                views: 0 // listing_views table not yet created
            });
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    }, [currentUser]);

    const fetchLikedListings = React.useCallback(async () => {
        try {
            const { data } = await supabase
                .from('favorites')
                .select(`
                    listing_id,
                    listings (*)
                `)
                .eq('user_id', currentUser.id);

            if (data) {
                const list = data.map(item => item.listings).filter(Boolean);
                setLikedListings(list);
            }
        } catch (err) {
            console.error('Error fetching liked listings:', err);
        } finally {
            setLoadingLiked(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            fetchLikedListings();
            fetchStats();
        }
    }, [currentUser, fetchLikedListings, fetchStats]);

    async function handleSignOut() {
        await signOut();
        toast.success('Signed out. See you soon! 👋');
    }

    const menuItems = [
        { icon: '📋', label: 'My Listings', sub: 'View & manage your listings', action: () => navigate('/my-listings') },
        { icon: '🔔', label: 'Notifications', sub: 'Buyer inquiries & alerts', action: () => navigate('/notifications') },
        { icon: '📊', label: 'Price Trends', sub: 'Latest market prices', action: () => navigate('/price-trends') },
        { icon: '⚡', label: 'Boost Listing', sub: 'Get more visibility', action: () => navigate('/boost') },
        { icon: '❓', label: 'Help & FAQ', sub: 'Support & guides', action: () => toast('Help coming soon!') },
        { icon: '🔐', label: 'Privacy Policy', sub: 'Terms & conditions', action: () => toast('Privacy policy') },
    ];

    return (
        <div className="prof-wrap">
            {/* Left Card */}
            <div className="prof-card">
                <div className="prof-hd-bg">
                    <div className="p-av">{initials}</div>
                    <div className="p-nm">{p.full_name || 'My Account'}</div>
                    <div className="p-meta">{p.location ? `📍 ${p.location} · ` : ''}Member since {yr}</div>
                    <div className="p-badges">
                        <span className="p-bdg">✓ OTP Verified</span>
                    </div>
                </div>
                <div className="p-stats">
                    <div className="pst"><div className="n">{stats.listings}</div><div className="l">Listings</div></div>
                    <div className="pst"><div className="n">{stats.inquiries}</div><div className="l">Inquiries</div></div>
                    <div className="pst"><div className="n">{stats.sold}</div><div className="l">Sold</div></div>
                </div>
                <div className="prof-body">
                    {menuItems.map((m, i) => (
                        <div key={i} className="prof-mi" onClick={m.action}>
                            <div className="pmi-l">
                                <div className="pmi-ic-box">{m.icon}</div>
                                <div>
                                    <div className="pmi-lbl">{m.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--g3)', marginTop: 1 }}>{m.sub}</div>
                                </div>
                            </div>
                            <span className="pmi-r">›</span>
                        </div>
                    ))}
                    <div className="prof-mi" onClick={handleSignOut}>
                        <div className="pmi-l">
                            <div className="pmi-ic-box" style={{ color: 'var(--red)', background: 'var(--red-light)' }}>🚪</div>
                            <div>
                                <div className="pmi-lbl" style={{ color: 'var(--red)' }}>Sign Out</div>
                                <div style={{ fontSize: 11, color: 'var(--red)', opacity: 0.7 }}>Securely leave your account</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — Quick Actions */}
            <div className="prof-right">
                <div className="section-card" style={{ marginBottom: 16 }}>
                    <h4>Quick Actions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/sell')}>
                            + Post New Listing
                        </button>
                        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/my-listings')}>
                            📋 My Listings
                        </button>
                        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/boost')}>
                            ⚡ Boost a Listing
                        </button>
                    </div>
                </div>

                <div className="section-card">
                    <h4>Account Details</h4>
                    <div className="prof-detail-row">
                        <span>📱 Phone</span>
                        <span>{p.phone || '—'}</span>
                    </div>
                    <div className="prof-detail-row">
                        <span>📧 Email</span>
                        <span>{p.email || '—'}</span>
                    </div>
                </div>

                <div className="section-card" style={{ marginTop: 16 }}>
                    <h4>❤️ Liked Animals</h4>
                    {loadingLiked ? (
                        <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner dark" /></div>
                    ) : likedListings.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--g3)', textAlign: 'center', padding: '20px 0' }}>You haven't liked any animals yet.</p>
                    ) : (
                        <div className="liked-animals-grid">
                            {likedListings.map(l => (
                                <div key={l.id} className="mini-liked-card" onClick={() => navigate(`/listing/${l.id}`)}>
                                    <div className="mlc-img">
                                        {l.image_url ? <img src={l.image_url} alt={l.title} /> : <span>🐾</span>}
                                    </div>
                                    <div className="mlc-info">
                                        <div className="mlc-name">{l.title}</div>
                                        <div className="mlc-price">₹{Number(l.price).toLocaleString()}</div>
                                    </div>
                                    <span className="mlc-arrow">›</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
