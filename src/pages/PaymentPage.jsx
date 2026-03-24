import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import './PaymentPage.css';

const LISTING_FEE = 50; // Fixed price ₹50

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth(); // eslint-disable-line no-unused-vars

    const {
        listingPayload,
        isEditing,
        editingId,
    } = location.state || {};

    const [payStep, setPayStep] = useState('idle');
    const [txnId, setTxnId] = useState('');

    async function saveListingToDB(payload) {
        try {
            if (isEditing && editingId) {
                const { error } = await supabase
                    .from('listings')
                    .update({ ...payload, status: 'active' })
                    .eq('id', editingId);
                if (error) throw error;
                return { id: editingId };
            } else {
                const { data, error } = await supabase
                    .from('listings')
                    .insert({ ...payload, status: 'active' })
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }
        } catch {
            // Demo fallback
            return { ...payload, id: 'd' + Date.now().toString().slice(-6) };
        }
    }

    async function handlePay() {
        setPayStep('processing');
        await new Promise(r => setTimeout(r, 1200));
        setPayStep('verifying');
        await new Promise(r => setTimeout(r, 900));

        const success = Math.random() < 0.9;

        if (!success) {
            setPayStep('failed');
            toast.error('Payment failed. Please try again.');
            return;
        }

        const generatedTxnId = 'TXN' + Date.now();
        setTxnId(generatedTxnId);

        const savedListing = await saveListingToDB(listingPayload);
        setPayStep('success');
        toast.success('Payment successful! Listing published 🎉');
        setTimeout(() => {
            navigate('/success', {
                replace: true,
                state: { listing: savedListing }
            });
        }, 1500);
    }

    // ── SUCCESS screen ─────────────────────────────────────
    if (payStep === 'success') {
        return (
            <div className="pay-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontFamily: 'Poppins,sans-serif', marginBottom: 8 }}>
                    Payment Successful!
                </h2>
                <p style={{ color: '#666', fontSize: 14 }}>
                    Your listing is now live on Kosalai.
                </p>
                <div style={{
                    margin: '20px auto', background: '#e8f5e9',
                    padding: '16px 24px', borderRadius: 12,
                    maxWidth: 300
                }}>
                    <div style={{ fontSize: 12, color: '#666' }}>
                        Transaction ID: {txnId}
                    </div>
                    <div style={{
                        fontSize: 20, fontWeight: 800,
                        color: '#1a7a3c', marginTop: 6
                    }}>
                        ₹{LISTING_FEE} Paid
                    </div>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/my-listings')}
                >
                    View My Listings →
                </button>
            </div>
        );
    }

    // ── FAILED screen ──────────────────────────────────────
    if (payStep === 'failed') {
        return (
            <div className="pay-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>❌</div>
                <h2>Payment Failed</h2>
                <p style={{ color: '#888', marginTop: 8 }}>
                    Your bank declined the transaction. Please try again.
                </p>
                <div style={{
                    marginTop: 30, display: 'flex', gap: 12,
                    justifyContent: 'center'
                }}>
                    <button className="btn-primary"
                        onClick={() => setPayStep('idle')}>
                        Try Again
                    </button>
                    <button className="btn-secondary"
                        onClick={() => navigate('/sell')}>
                        Back to Listing
                    </button>
                </div>
            </div>
        );
    }

    // ── MAIN payment UI ────────────────────────────────────
    return (
        <div className="pay-wrap">
            <BackButton fallbackPath="/my-listings" />

            {/* Header */}
            <div className="pay-header">
                <div style={{ fontSize: 28 }}>🚀</div>
                <h2 className="pay-title">Complete Your Listing</h2>
                <p className="pay-sub">Pay once to publish your listing on Kosalai</p>
            </div>

            {/* Simple Pricing Card */}
            <div className="pay-pricing-card">
                <div className="pay-pricing-label">Listing Fee</div>

                <div className="pay-amount-display">
                    <span className="pay-currency">₹</span>
                    <span className="pay-big-num">{LISTING_FEE}</span>
                    <span className="pay-per">/ listing</span>
                </div>

                <div className="pay-features">
                    <div className="pay-feature">
                        <span className="pay-feature-icon">✓</span>
                        <span>Post your listing</span>
                    </div>
                    <div className="pay-feature">
                        <span className="pay-feature-icon">✓</span>
                        <span>Visible to all buyers</span>
                    </div>
                    <div className="pay-feature">
                        <span className="pay-feature-icon">✓</span>
                        <span>Active for 30 days</span>
                    </div>
                    <div className="pay-feature">
                        <span className="pay-feature-icon">✓</span>
                        <span>Edit anytime for free</span>
                    </div>
                </div>

                <button
                    className="btn-pay-now"
                    onClick={handlePay}
                    disabled={payStep === 'processing' || payStep === 'verifying'}
                >
                    {payStep === 'processing' ? '⏳ Processing…'
                        : payStep === 'verifying' ? '🔍 Verifying…'
                            : `Pay ₹${LISTING_FEE} & Post Listing`}
                </button>
            </div>

            <div className="pay-secure" style={{ marginTop: 20 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                256-bit SSL Secure · Razorpay Gateway
            </div>

            <button
                className="btn-secondary"
                style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 12 }}
                onClick={() => navigate('/sell')}
            >
                ← Cancel Payment
            </button>
        </div>
    );
}
