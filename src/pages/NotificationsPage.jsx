import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import './NotificationsPage.css';

const MOCK_PRICE_ALERT = {
    icon: '📊',
    type: 'price_alert',
    title: 'Price Alert: Buffalo prices up 12%',
    sub: 'Murrah Buffalo prices have increased in Telangana this week.',
    time: 'Just now',
    unread: true,
    is_mock: true
};

const TYPE_MAP = {
    like: 'p',
    inquiry: 'g',
    promote: 'o',
    price_alert: 'b'
};

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = React.useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            // Always add the dynamic price alert at top as requested
            const list = data || [];
            if (!list.find(n => n.type === 'price_alert')) {
                setNotifications([MOCK_PRICE_ALERT, ...list]);
            } else {
                setNotifications(list);
            }
        } catch (err) {
            console.error('Fetch notifs error:', err);
            setNotifications([MOCK_PRICE_ALERT]);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchNotifications();

        if (!currentUser) return;

        const channel = supabase
            .channel(`notifs-${currentUser.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${currentUser.id}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications, currentUser]);

    async function markAllRead() {
        if (!currentUser) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', currentUser.id);
        fetchNotifications();
    }

    const unreadCount = notifications.filter(n => n.unread || !n.is_read).length;

    return (
        <div className="notif-wrap">
            <BackButton fallbackPath="/" />
            <div className="notif-hd">
                <h2>{t('notificationsPage.title')} {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}</h2>
                <button className="notif-mark" onClick={markAllRead}>{t('notificationsPage.markAllRead')}</button>
            </div>
            {unreadCount > 0 && <div className="unrd-banner">{unreadCount} {t('notificationsPage.markAllRead')}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner dark" /></div>
            ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--g3)' }}>
                    <div style={{ fontSize: 50 }}>🔔</div>
                    <p>{t('notificationsPage.empty')}</p>
                    <p style={{ fontSize: 13, marginTop: 4, color: 'var(--g3)' }}>{t('notificationsPage.emptySubtitle')}</p>
                </div>
            ) : (
                notifications.map((n, i) => (
                    <div
                        key={n.id || i}
                        className={`ni${(n.unread || !n.is_read) ? ' unrd' : ''}`}
                        onClick={() => {
                            if (n.metadata?.listing_id) navigate(`/listing/${n.metadata.listing_id}`);
                            else if (n.is_mock) navigate('/');
                        }}
                    >
                        <div className={`ni-ic ${TYPE_MAP[n.type] || 'g'}`}>{n.icon || '🔔'}</div>
                        <div className="ni-txt">
                            <div className="ni-ttl" style={{ fontWeight: 800 }}>{n.title}</div>
                            <div className="ni-sb">{n.message || n.sub}</div>
                        </div>
                        <div className="ni-r">
                            <div className="ni-time">
                                {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : n.time}
                            </div>
                            {(n.unread || !n.is_read) && <div className="ni-dot" />}
                        </div>
                    </div>
                ))
            )
            }
        </div>
    );
}
