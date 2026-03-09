import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const NAV_ITEMS = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '🔍', label: 'Search', path: '/search' },
    { icon: '+', label: 'Sell', path: '/sell', isSell: true },
    { icon: '🔔', label: 'Alerts', path: '/notifications' },
    { icon: '👤', label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.path}
                        className={`bnav-btn${pathname === item.path && !item.isSell ? ' active' : ''}${item.isSell ? ' bnav-sell' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.isSell ? (
                            <span className="bnav-sell-icon">+</span>
                        ) : (
                            <span className="bnav-icon">{item.icon}</span>
                        )}
                        <span className="bnav-label">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
