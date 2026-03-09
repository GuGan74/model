import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './PaymentPage.css';

const METHODS = [
    { id: 'upi', icon: '📱', name: 'UPI', sub: 'GPay, PhonePe, Paytm' },
    { id: 'card', icon: '💳', name: 'Credit/Debit Card', sub: 'Visa, Mastercard, RuPay' },
    { id: 'net', icon: '🏦', name: 'Net Banking', sub: 'All major banks' },
];

export default function PaymentPage() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState('upi');
    const [paying, setPaying] = useState(false);

    async function handlePay() {
        setPaying(true);
        await new Promise(r => setTimeout(r, 1800));
        setPaying(false);
        toast.success('Payment successful! 🎉');
        navigate('/success');
    }

    return (
        <div className="pay-wrap">
            <div className="pay-hero">
                <h2>💰 Listing Fee Payment</h2>
                <p>One-time fee to publish your listing on PashuBazaar</p>
            </div>

            <div className="pay-amt-card">
                <div className="pay-big">₹50</div>
                <div className="pay-sub">Total Amount to Pay</div>
                <div className="pay-brkdn">
                    <div className="pay-row"><span>Listing Fee</span><strong>₹50</strong></div>
                    <div className="pay-row"><span>GST (0%)</span><strong>₹0</strong></div>
                    <div className="pay-row total"><span>Total</span><strong>₹50</strong></div>
                </div>
            </div>

            <div className="pay-methods">
                <h3>Choose Payment Method</h3>
                {METHODS.map(m => (
                    <div key={m.id} className={`pay-method${selected === m.id ? ' sel' : ''}`} onClick={() => setSelected(m.id)}>
                        <div className="pm-ic">{m.icon}</div>
                        <div><div className="pm-nm">{m.name}</div><div className="pm-sb">{m.sub}</div></div>
                        <div className={`pm-radio${selected === m.id ? ' chk' : ''}`} />
                    </div>
                ))}
            </div>

            <div className="pay-secure">🔒 256-bit SSL secured · Razorpay powered</div>

            <button className="btn-pay" onClick={handlePay} disabled={paying}>
                {paying ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing…</> : `Pay ₹50 →`}
            </button>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => navigate(-1)}>
                ← Back
            </button>
        </div>
    );
}
