import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import './AdminPage.css';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASS = '12gugan*#';

export default function AdminPage() {
    const navigate = useNavigate();
    const [authenticated, setAuthenticated] = useState(() => {
        try { return localStorage.getItem('pb_admin') === 'true'; } catch { return false; }
    });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginErr, setLoginErr] = useState('');
    const [logging, setLogging] = useState(false);

    // Dashboard state
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ users: 0, listings: 0, active: 0, pending: 0, reports: 0 });
    const [listings, setListings] = useState([]);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (authenticated) fetchDashboardData();
    }, [authenticated]);

    async function fetchDashboardData() {
        setLoadingData(true);
        try {
            // Fetch listings
            const { data: lData, count: lCount } = await supabase
                .from('listings')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .limit(50);

            // Fetch profiles
            const { data: pData, count: pCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .limit(50);

            const activeCount = (lData || []).filter(l => l.status === 'active').length;
            const pendingCount = (lData || []).filter(l => l.status === 'pending').length;

            // Fetch reports joined with listings
            const { data: rData } = await supabase
                .from('reports')
                .select('*, listings(*)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setStats({
                users: pCount || (pData?.length ?? 0),
                listings: lCount || (lData?.length ?? 0),
                active: activeCount,
                pending: pendingCount,
                reports: (rData || []).length
            });
            setListings(lData || []);
            setUsers(pData || []);
            setReports(rData || []);
        } catch (e) {
            toast.error('Failed to load DB data: ' + e.message);
        } finally {
            setLoadingData(false);
        }
    }

    async function removeListing(id) {
        const { error } = await supabase.from('listings').delete().eq('id', id);
        if (error) { toast.error('Failed to remove: ' + error.message); return; }
        setListings(prev => prev.filter(l => l.id !== id));
        toast.success('Listing removed ✓');
    }

    async function toggleStatus(id, current) {
        const newStatus = current === 'active' ? 'pending' : 'active';
        const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id);
        if (error) { toast.error('Update failed'); return; }
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        toast.success(`Status → ${newStatus}`);
    }

    async function resolveReport(reportId, action, listingId) {
        if (action === 'remove') {
            await supabase.from('listings').delete().eq('id', listingId);
            toast.success('Listing removed & Report resolved');
            setListings(prev => prev.filter(l => l.id !== listingId));
        } else {
            toast.success('Report dismissed');
        }
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
        setReports(prev => prev.filter(r => r.id !== reportId));
        setStats(s => ({ ...s, reports: s.reports - 1 }));
    }

    function handleLogin(e) {
        e.preventDefault();
        setLogging(true);
        setLoginErr('');
        setTimeout(() => {
            if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASS) {
                localStorage.setItem('pb_admin', 'true');
                setAuthenticated(true);
                toast.success('Admin access granted ✓');
            } else {
                setLoginErr('Invalid email or password');
            }
            setLogging(false);
        }, 600);
    }

    function handleLogout() {
        localStorage.removeItem('pb_admin');
        setAuthenticated(false);
        navigate('/');
    }

    // ─── LOGIN SCREEN ────────────────────────────────────
    if (!authenticated) {
        return (
            <div className="admin-login-page">
                <div className="admin-login-card">
                    <div className="adl-logo">🛡️</div>
                    <div className="adl-title">PashuBazaar Admin</div>
                    <div className="adl-sub">Restricted access — authorised personnel only</div>
                    <form onSubmit={handleLogin} className="adl-form">
                        <div className="adl-field">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="admin@gmail.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="adl-field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter admin password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {loginErr && <div className="adl-err">⚠️ {loginErr}</div>}
                        <button type="submit" className="adl-btn" disabled={logging}>
                            {logging ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying…</> : '🔐 Login to Admin'}
                        </button>
                    </form>
                    <button className="adl-back" onClick={() => navigate('/')}>← Back to Home</button>
                </div>
            </div>
        );
    }

    // ─── DASHBOARD ───────────────────────────────────────
    const statCards = [
        { label: 'Total Users', val: stats.users, icon: '👥', color: 'var(--blue)' },
        { label: 'Total Listings', val: stats.listings, icon: '📋', color: 'var(--green)' },
        { label: 'Active Listings', val: stats.active, icon: '✅', color: 'var(--green)' },
        { label: 'Pending Reports', val: stats.reports, icon: '🚩', color: 'var(--red)' },
    ];

    return (
        <div className="admin-page">
            <div className="adm-top">
                <div>
                    <div className="adm-brand">PashuBazaar Admin Panel</div>
                    <div className="adm-title">🛡️ Admin Dashboard</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                        onClick={fetchDashboardData}
                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{ padding: '8px 16px', background: 'rgba(220,38,38,.25)', border: '1px solid rgba(220,38,38,.4)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                    >
                        🚪 Logout
                    </button>
                    <div className="adm-av">AD</div>
                </div>
            </div>

            <div className="adm-tabs">
                {['overview', 'listings', 'users', 'reports'].map(t => (
                    <button key={t} className={`adm-tab${activeTab === t ? ' act' : ''}`} onClick={() => setActiveTab(t)}>
                        {t === 'overview' ? '📊 Overview' : t === 'listings' ? '📋 Listings' : t === 'users' ? '👥 Users' : '🚩 Reports'}
                    </button>
                ))}
            </div>

            <div className="adm-body">
                {loadingData && (
                    <div className="adm-loading">
                        <div className="spinner" style={{ borderTopColor: 'var(--green)', width: 28, height: 28 }} />
                        <span>Loading live data…</span>
                    </div>
                )}

                {/* OVERVIEW */}
                {activeTab === 'overview' && !loadingData && (
                    <div className="animate-fadeIn">
                        <div className="adm-stats-grid">
                            {statCards.map(s => (
                                <div key={s.label} className="adm-stat-card">
                                    <div className="adm-stat-icon" style={{ background: s.color + '22', color: s.color }}>{s.icon}</div>
                                    <div className="adm-stat-val">{s.val}</div>
                                    <div className="adm-stat-lbl">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="adm-section">
                            <h3 className="adm-sec-title">Recent Listings (Live from Database)</h3>
                            {listings.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: 40 }}>No listings in database yet</div>
                            ) : (
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead><tr><th>Title</th><th>Category</th><th>Price</th><th>Location</th><th>Status</th><th>Date</th></tr></thead>
                                        <tbody>
                                            {listings.slice(0, 8).map(l => (
                                                <tr key={l.id}>
                                                    <td style={{ color: 'rgba(255,255,255,.85)', fontWeight: 700 }}>{l.title || '—'}</td>
                                                    <td style={{ textTransform: 'capitalize' }}>{l.category || '—'}</td>
                                                    <td>{l.for_adoption ? 'Free' : l.price ? `₹${Number(l.price).toLocaleString('en-IN')}` : '—'}</td>
                                                    <td>{l.location || l.city || '—'}</td>
                                                    <td><span className={`adm-status ${l.status}`}>{l.status}</span></td>
                                                    <td>{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LISTINGS */}
                {activeTab === 'listings' && !loadingData && (
                    <div className="animate-fadeIn">
                        <div className="adm-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                <h3 className="adm-sec-title" style={{ marginBottom: 0 }}>All Listings — {listings.length} total</h3>
                                <button className="adm-primary-btn" onClick={() => navigate('/sell')}>+ Add Listing</button>
                            </div>
                            {listings.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: 60 }}>
                                    <div style={{ fontSize: 60 }}>📋</div>
                                    <div style={{ marginTop: 12 }}>No listings in database yet</div>
                                </div>
                            ) : (
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead><tr><th>Title</th><th>Category</th><th>Price</th><th>Location</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {listings.map(l => (
                                                <tr key={l.id}>
                                                    <td style={{ color: 'rgba(255,255,255,.85)', fontWeight: 700 }}>{l.title || '—'}</td>
                                                    <td style={{ textTransform: 'capitalize' }}>{l.category || '—'}</td>
                                                    <td>{l.for_adoption ? '💜 Free' : l.price ? `₹${Number(l.price).toLocaleString('en-IN')}` : '—'}</td>
                                                    <td>{l.location || '—'}</td>
                                                    <td>
                                                        <button
                                                            className={`adm-status ${l.status}`}
                                                            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                                                            onClick={() => toggleStatus(l.id, l.status)}
                                                            title="Click to toggle status"
                                                        >
                                                            {l.status}
                                                        </button>
                                                    </td>
                                                    <td>{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                                                    <td>
                                                        <button className="adm-act-btn" onClick={() => navigate(`/listing/${l.id}`)}>View</button>
                                                        <button className="adm-act-btn danger" onClick={() => removeListing(l.id)}>Remove</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* USERS */}
                {activeTab === 'users' && !loadingData && (
                    <div className="animate-fadeIn">
                        <div className="adm-section">
                            <h3 className="adm-sec-title">Registered Users — {users.length} total</h3>
                            {users.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: 60 }}>
                                    <div style={{ fontSize: 60 }}>👥</div>
                                    <div style={{ marginTop: 12 }}>No users in database yet</div>
                                </div>
                            ) : (
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Location</th><th>Joined</th></tr></thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td style={{ color: 'rgba(255,255,255,.85)', fontWeight: 700 }}>{u.full_name || '—'}</td>
                                                    <td>{u.phone || '—'}</td>
                                                    <td style={{ textTransform: 'capitalize', fontSize: 11 }}>{(u.role || '').replace(/-/g, ' ')}</td>
                                                    <td>{u.location || '—'}</td>
                                                    <td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* REPORTS */}
                {activeTab === 'reports' && !loadingData && (
                    <div className="animate-fadeIn">
                        <div className="adm-section">
                            <h3 className="adm-sec-title">Reported Listings — {reports.length} pending</h3>
                            {reports.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: 60 }}>
                                    <div style={{ fontSize: 60 }}>🚩</div>
                                    <div style={{ marginTop: 12 }}>No pending reports</div>
                                </div>
                            ) : (
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead><tr><th>Listing</th><th>Reason</th><th>Reported On</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {reports.map(r => (
                                                <tr key={r.id}>
                                                    <td>
                                                        <div style={{ color: 'rgba(255,255,255,.85)', fontWeight: 700 }}>{r.listings?.title || 'Unknown/Deleted'}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--g4)' }}>ID: {r.listing_id.substring(0, 8)}...</div>
                                                    </td>
                                                    <td style={{ color: '#ff4d4f', maxWidth: 200, whiteSpace: 'normal', lineHeight: 1.4 }}>{r.reason}</td>
                                                    <td>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                                                    <td>
                                                        {r.listings && <button className="adm-act-btn" onClick={() => window.open(`/listing/${r.listing_id}`, '_blank')}>View</button>}
                                                        <button className="adm-act-btn" style={{ marginLeft: 6, borderColor: 'var(--green)', color: 'var(--green)' }} onClick={() => resolveReport(r.id, 'keep', r.listing_id)}>Keep</button>
                                                        <button className="adm-act-btn danger" style={{ marginLeft: 6 }} onClick={() => resolveReport(r.id, 'remove', r.listing_id)}>Remove</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
