import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import './PaymentPage.css';

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Read tier from BoostPage navigation state, fallback to Basic
    const tier = location.state?.tier || { name: 'Basic', price: 50 };
    const amount = tier.price;

    const [payStep, setPayStep] = useState('idle');
    const [selected, setSelected] = useState('upi');
    const [txnId, setTxnId] = useState('');

    async function handlePay() {
        setPayStep('processing');
        await new Promise(r => setTimeout(r, 1200));

        setPayStep('verifying');
        await new Promise(r => setTimeout(r, 900));

        const success = Math.random() < 0.9;
        if (success) {
            setTxnId('TXN' + Date.now());
            setPayStep('success');
            toast.success('Payment successful! 🎉');
        } else {
            setPayStep('failed');
            toast.error('Payment failed');
        }
    }

    if (payStep === 'success') {
        return (
            <div className="pay-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
                <h2>Payment Successful!</h2>
                <div style={{ margin: '20px 0', background: 'var(--green-light)', padding: 20, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: 'var(--g3)' }}>Transaction ID: {txnId}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>Amount: ₹{amount}</div>
                </div>
                <button className="btn-primary" onClick={() => navigate('/my-listings')}>Go to My Listings →</button>
            </div>
        );
    }

    if (payStep === 'failed') {
        return (
            <div className="pay-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>❌</div>
                <h2>Payment Failed</h2>
                <p style={{ color: 'var(--g3)', marginTop: 10 }}>Your bank declined the transaction. Please try again.</p>
                <div style={{ marginTop: 30 }}>
                    <button className="btn-primary" onClick={() => setPayStep('idle')}>Try Again</button>
                    <button className="btn-secondary" style={{ marginLeft: 10 }} onClick={() => navigate(-1)}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="pay-wrap">
            <div className="pay-hero">
                <h2>💰 Boost Payment</h2>
                <p>Boosting your listing with {tier.name} plan</p>
            </div>

            <div className="pay-amt-card">
                <div className="pay-big">₹{amount}</div>
                <div className="pay-sub">Total Amount to Pay</div>
            </div>

            <div className="pay-methods">
                <h3>Choose Payment Method</h3>

                <div className={`pay-method${selected === 'upi' ? ' sel' : ''}`} onClick={() => setSelected('upi')}>
                    <div className="pm-ic">📱</div>
                    <div style={{ flex: 1 }}>
                        <div className="pm-nm">UPI</div>
                        <div className="pm-sb">GPay, PhonePe, Paytm</div>
                    </div>
                </div>
                {selected === 'upi' && (
                    <div style={{ padding: '0 16px 16px' }}>
                        <input placeholder="Enter UPI ID (e.g. name@okhdfcbank)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--g5)' }} />
                    </div>
                )}

                <div className={`pay-method${selected === 'card' ? ' sel' : ''}`} onClick={() => setSelected('card')}>
                    <div className="pm-ic">💳</div>
                    <div style={{ flex: 1 }}>
                        <div className="pm-nm">Credit/Debit Card</div>
                        <div className="pm-sb">Visa, Mastercard, RuPay</div>
                    </div>
                </div>
                {selected === 'card' && (
                    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input placeholder="Card Number" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--g5)' }} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder="MM/YY" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--g5)' }} />
                            <input placeholder="CVV" type="password" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--g5)' }} />
                        </div>
                    </div>
                )}

                <div className={`pay-method${selected === 'net' ? ' sel' : ''}`} onClick={() => setSelected('net')}>
                    <div className="pm-ic">🏦</div>
                    <div style={{ flex: 1 }}>
                        <div className="pm-nm">Net Banking</div>
                        <div className="pm-sb">All major banks</div>
                    </div>
                </div>
            </div>

            <div className="pay-secure" style={{ textAlign: 'center', fontSize: 12, color: 'var(--g3)', margin: '20px 0' }}>
                🔒 256-bit SSL secured · Razorpay powered
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {payStep === 'idle' ? (
                    <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16 }} onClick={handlePay}>
                        Pay ₹{amount} →
                    </button>
                ) : (
                    <div style={{ padding: '16px', background: 'var(--green-light)', borderRadius: '12px', border: '1px solid var(--green)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: payStep === 'processing' || payStep === 'verifying' ? 'var(--green)' : 'var(--g3)' }}>
                            <div className={`spinner ${payStep === 'processing' ? 'dark' : ''}`} style={{ borderColor: payStep === 'processing' ? 'var(--green)' : 'transparent', borderTopColor: 'var(--green)' }}></div>
                            <span style={{ fontWeight: 800 }}>Connecting to payment gateway...</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', color: payStep === 'verifying' ? 'var(--green)' : 'var(--g4)' }}>
                            <div style={{ width: '18px', textAlign: 'center' }}>{payStep === 'verifying' ? '🔄' : '⬤'}</div>
                            <span style={{ fontWeight: payStep === 'verifying' ? 800 : 400 }}>Processing ₹{amount}...</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', color: 'var(--g4)' }}>
                            <div style={{ width: '18px', textAlign: 'center' }}>⬤</div>
                            <span>Waiting for bank confirmation...</span>
                        </div>
                    </div>
                )}

                {payStep === 'idle' && (
                    <button className="btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={() => navigate(-1)}>
                        ← Cancel Payment
                    </button>
                )}
            </div>
        </div>
    );
}
