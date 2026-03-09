import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './PriceTrendsPage.css';

const ANIMAL_EMOJIS = {
    cow: '🐄', buffalo: '🦬', goat: '🐐', sheep: '🐑',
    poultry: '🐓', dog: '🐕', cat: '🐈', bird: '🦜',
};

function avg(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

export default function PriceTrendsPage() {
    const navigate = useNavigate();
    const [trends, setTrends] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalListings, setTotalListings] = useState(0);

    const fetchTrends = React.useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('category, price, state, location, created_at')
                .eq('status', 'active')
                .gt('price', 0);

            if (error) throw error;

            setTotalListings(data.length);

            // Group by category
            const catMap = {};
            for (const l of data) {
                if (!l.category) continue;
                if (!catMap[l.category]) catMap[l.category] = [];
                catMap[l.category].push(l.price);
            }

            const cats = Object.entries(catMap).map(([cat, prices]) => {
                prices.sort((a, b) => a - b);
                const min = prices[0];
                const max = prices[prices.length - 1];
                const avgP = avg(prices);
                const fill = Math.min(95, Math.max(20, Math.round((avgP / 200000) * 100)));
                return { cat, min, max, avgP, count: prices.length, fill };
            }).sort((a, b) => b.avgP - a.avgP);
            setTrends(cats);

            // Group by state
            const stateMap = {};
            for (const l of data) {
                if (!l.state) continue;
                if (!stateMap[l.state]) stateMap[l.state] = { cow: [], buffalo: [], goat: [] };
                if (stateMap[l.state][l.category] !== undefined) {
                    stateMap[l.state][l.category].push(l.price);
                }
            }
            const stateRows = Object.entries(stateMap).slice(0, 8).map(([state, v]) => ({
                state,
                cow: avg(v.cow || []),
                buffalo: avg(v.buffalo || []),
                goat: avg(v.goat || []),
            }));
            setStateData(stateRows);
        } catch (err) {
            console.error('Failed to fetch trends:', err);
            setTrends([]);
            setStateData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTrends(); }, [fetchTrends]);

    function fmtPrice(n) {
        if (!n) return '—';
        if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
        if (n >= 1000) return '₹' + Math.round(n / 1000) + 'K';
        return '₹' + n;
    }

    return (
        <div className="pt-layout">
            <div className="pt-header">
                <div>
                    <h2 className="pt-title">📊 Live Price Trends — South India</h2>
                    <div className="pt-sub">
                        {loading ? 'Loading…' : `Live from database · ${totalListings} active listings`}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-secondary" onClick={fetchTrends} style={{ padding: '9px 16px' }}>🔄 Refresh</button>
                    <button className="btn-secondary" onClick={() => navigate('/')}>← Back</button>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <div className="spinner dark" style={{ margin: '0 auto', width: 28, height: 28 }} />
                    <div style={{ marginTop: 12, color: 'var(--g3)' }}>Loading live price data…</div>
                </div>
            )}

            {!loading && trends.length === 0 && (
                <div className="pt-empty">
                    <div style={{ fontSize: 72 }}>📊</div>
                    <h3>No listings yet</h3>
                    <p>Price trends will appear automatically once sellers start posting listings.</p>
                    <button className="btn-primary" onClick={() => navigate('/sell')}>Post the First Listing →</button>
                </div>
            )}

            {!loading && trends.length > 0 && (
                <>
                    <div className="pt-grid">
                        {trends.map(d => (
                            <div key={d.cat} className="pt-card">
                                <div className="pt-card-top">
                                    <span className="pt-emoji">{ANIMAL_EMOJIS[d.cat] || '🐾'}</span>
                                    <div>
                                        <div className="pt-aname" style={{ textTransform: 'capitalize' }}>{d.cat}</div>
                                        <div className="pt-range">{fmtPrice(d.min)} — {fmtPrice(d.max)}</div>
                                    </div>
                                </div>
                                <div className="pt-avg">Avg: <strong>{fmtPrice(d.avgP)}</strong> · {d.count} listings</div>
                                <div className="pt-bar-track">
                                    <div className="pt-bar-fill" style={{ width: `${d.fill}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {stateData.length > 0 && (
                        <div className="pt-table-section">
                            <h3 className="pt-table-title">State-wise Average Prices (from live listings)</h3>
                            <div className="pt-table-wrap">
                                <table className="pt-table">
                                    <thead>
                                        <tr><th>State</th><th>Avg Cow</th><th>Avg Buffalo</th><th>Avg Goat</th></tr>
                                    </thead>
                                    <tbody>
                                        {stateData.map(r => (
                                            <tr key={r.state}>
                                                <td><strong>{r.state}</strong></td>
                                                <td>{fmtPrice(r.cow)}</td>
                                                <td>{fmtPrice(r.buffalo)}</td>
                                                <td>{fmtPrice(r.goat)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
