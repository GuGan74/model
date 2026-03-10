import React from 'react';
import './SkeletonCard.css';

export default function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="sk-img shimmer" />
            <div className="sk-body">
                <div className="sk-title shimmer" />
                <div className="sk-sub shimmer" />
                <div className="sk-row">
                    <div className="sk-stat shimmer" />
                    <div className="sk-stat shimmer" />
                </div>
                <div className="sk-btn shimmer" />
            </div>
        </div>
    );
}
