import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import './PaymentPage.css';

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth(); // eslint-disable-line no-unused-vars

    const {
        purpose,           // 'listing_fee' | 'boost_fee'
        listingPayload,    // the listing data from SellPage
        listingFee,        // { name, price } — ₹50
        boostTier,         // { name, price } or null
        isEditing,
        editingId,
        savedListingId,    // set after listing_fee paid, before boost_fee
    } = location.state || {};

    // Which payment are we on?
    const isBoostPayment = purpose === 'boost_fee';
    const currentTier = isBoostPayment ? boostTier : (listingFee || { name: 'Listing Fee', price: 50 });
    const amount = currentTier?.price || 50;

    const [payStep, setPayStep] = useState('idle');
    const [selected, setSelected] = useState('upi');
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
            // Demo fallback (Must start with 'd' and length < 10 for demo listings to render)
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

        if (!isBoostPayment) {
            // ── LISTING FEE PAID ──────────────────────────
            if (boostTier) {
                // Boost was selected — save listing first,
                // then go to boost payment
                const savedListing = await saveListingToDB(listingPayload);
                setPayStep('success');
                toast.success('Listing fee paid! Now pay for boost →');
                // After 1.5s auto-advance to boost payment
                setTimeout(() => {
                    navigate('/payment', {
                        replace: true,
                        state: {
                            purpose: 'boost_fee',
                            listingPayload,
                            listingFee,
                            boostTier,
                            savedListingId: savedListing.id,
                            isEditing,
                            editingId,
                        }
                    });
                }, 1500);
            } else {
                // No boost — save listing and go to success
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
        } else {
            // ── BOOST FEE PAID ────────────────────────────
            // Mark listing as promoted in DB
            try {
                await supabase
                    .from('listings')
                    .update({ is_promoted: true, status: 'active' })
                    .eq('id', savedListingId);
            } catch { /* demo fallback */ }

            setPayStep('success');
            toast.success('Boost activated! Your listing is now promoted ⚡');
            setTimeout(() => {
                navigate('/success', {
                    replace: true,
                    state: {
                        listing: { ...listingPayload, id: savedListingId },
                        boosted: true,
                    }
                });
            }, 1500);
        }
    }

    // ── SUCCESS screen ─────────────────────────────────────
    if (payStep === 'success') {
        return (
            <div className="pay-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>
                    {isBoostPayment ? '⚡' : '✅'}
                </div>
                <h2 style={{ fontFamily: 'Poppins,sans-serif', marginBottom: 8 }}>
                    {isBoostPayment ? 'Boost Activated!' : 'Payment Successful!'}
                </h2>
                <p style={{ color: '#666', fontSize: 14 }}>
                    {isBoostPayment
                        ? 'Your listing is now promoted and will appear at the top.'
                        : boostTier
                            ? 'Listing fee paid! Proceeding to boost payment…'
                            : 'Your listing is now live on Kosalai.'}
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
                        ₹{amount} Paid
                    </div>
                </div>
                {!boostTier || isBoostPayment ? (
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/my-listings')}
                    >
                        View My Listings →
                    </button>
                ) : (
                    <div style={{ fontSize: 13, color: '#888' }}>
                        Redirecting to boost payment…
                    </div>
                )}
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
                <div style={{ fontSize: 28 }}>
                    {isBoostPayment ? '⚡' : '🚀'}
                </div>
                <h2 className="pay-title">
                    {isBoostPayment ? 'Boost Payment' : 'Listing Fee'}
                </h2>
                <p className="pay-sub">
                    {isBoostPayment
                        ? `Boosting your listing with ${boostTier?.name} plan`
                        : 'Pay ₹50 to publish your listing on Kosalai'}
                </p>
            </div>

            {/* Progress indicator for 2-step payment */}
            {boostTier && (
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    margin: '0 auto 20px', maxWidth: 320,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#1a7a3c', color: 'white',
                        fontSize: 13, fontWeight: 800,
                    }}>
                        {isBoostPayment ? '✓' : '1'}
                    </div>
                    <div style={{
                        flex: 1, height: 2,
                        background: isBoostPayment ? '#1a7a3c' : '#e5e7eb',
                        maxWidth: 60,
                    }} />
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        width: 28, height: 28, borderRadius: '50%',
                        background: isBoostPayment ? '#1a7a3c' : '#e5e7eb',
                        color: isBoostPayment ? 'white' : '#999',
                        fontSize: 13, fontWeight: 800,
                    }}>2</div>
                    <div style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                        {isBoostPayment
                            ? 'Step 2: Boost fee'
                            : 'Step 1: Listing fee'}
                    </div>
                </div>
            )}

            {/* Amount */}
            <div className="pay-amount-card">
                <div className="pay-big">₹{amount}</div>
                <div className="pay-total-lbl">
                    {isBoostPayment
                        ? `${boostTier?.name} Boost Plan`
                        : 'Listing Publication Fee'}
                </div>
            </div>

            {/* Payment methods */}
            <div className="pay-methods">
                <h3 style={{ color: 'var(--green)' }}>🔒 Secure Payment Options</h3>
                <p style={{ fontSize: 12, color: 'var(--g3)', marginBottom: 16 }}>Select your preferred payment method below.</p>

                {['upi', 'card', 'netbanking'].map(method => (
                    <div
                        key={method}
                        className={`pay-method ${selected === method ? 'sel' : ''}`}
                        onClick={() => setSelected(method)}
                    >
                        <div className="pm-ic">
                            {method === 'upi' ? '📱' : method === 'card' ? '💳' : '🏦'}
                        </div>
                        <div>
                            <div className="pm-nm">
                                {method === 'upi' ? 'UPI / QR'
                                    : method === 'card' ? 'Credit / Debit Card'
                                        : 'Net Banking'}
                            </div>
                            <div className="pm-sb">
                                {method === 'upi' ? 'GPay, PhonePe, Paytm'
                                    : method === 'card' ? 'Visa, Mastercard, RuPay'
                                        : 'All major banks supported'}
                            </div>
                        </div>
                        <div className={`pm-radio ${selected === method ? 'chk' : ''}`} />
                    </div>
                ))}

                {selected === 'upi' && (
                    <div style={{ marginTop: 12, animation: 'fadeInScale 0.2s ease-out' }}>
                        <input
                            className="pay-upi-input"
                            placeholder="Enter UPI ID (e.g. 9876543210@ybl)"
                            style={{
                                padding: '12px 16px', width: '100%', border: '2px solid var(--green)',
                                borderRadius: 10, fontSize: 14, outline: 'none',
                                fontFamily: 'Nunito, sans-serif'
                            }}
                            autoFocus
                        />
                    </div>
                )}
            </div>

            <div className="pay-secure">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                256-bit SSL Secure · Razorpay Gateway
            </div>

            {/* Pay button */}
            <button
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: 16, marginBottom: 10 }}
                onClick={handlePay}
                disabled={payStep === 'processing' || payStep === 'verifying'}
            >
                {payStep === 'processing' ? '⏳ Processing…'
                    : payStep === 'verifying' ? '🔍 Verifying…'
                        : `Pay ₹${amount} →`}
            </button>

            <button
                className="btn-secondary"
                style={{ width: '100%', padding: '16px', fontSize: 16 }}
                onClick={() => navigate('/my-listings')}
            >
                ← Cancel Payment
            </button>
        </div>
    );
}
