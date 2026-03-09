import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';
import toast from 'react-hot-toast';
import './SplashPage.css';


const DISTRICTS = [
    { group: '── Tamil Nadu', opts: ['Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Salem', 'Erode', 'Tirunelveli'] },
    { group: '── Andhra Pradesh', opts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'] },
    { group: '── Telangana', opts: ['Hyderabad', 'Warangal', 'Karimnagar'] },
    { group: '── Karnataka', opts: ['Bengaluru', 'Mysuru', 'Hubli'] },
    { group: '── Kerala', opts: ['Kochi', 'Thiruvananthapuram', 'Kozhikode'] },
];

export default function SplashPage() {
    const navigate = useNavigate();
    const { sendOTP, verifyOTP, signInWithGoogle, demoMode } = useAuth();

    const [step, setStep] = useState(1); // 1 = register, 2 = OTP
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [district, setDistrict] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpPhone, setOtpPhone] = useState('');

    async function handleGoogleLogin() {
        const { error } = await signInWithGoogle();
        if (error) toast.error('Google login failed: ' + error.message);
    }

    async function handleSendOTP() {
        if (!name.trim() || name.length < 2) {
            toast.error('Please enter your full name'); return;
        }
        if (!email.trim() || !email.includes('@')) {
            toast.error('Please enter a valid email address'); return;
        }
        if (!phone || phone.replace(/\D/g, '').length < 10) {
            toast.error('Enter a valid 10-digit mobile number'); return;
        }
        if (!district) {
            toast.error('Please select your district'); return;
        }
        setLoading(true);
        const formatted = '+91' + phone.replace(/\D/g, '').replace(/^91/, '');
        setOtpPhone(formatted);

        const { error, demo } = await sendOTP(formatted, name.trim(), district, 'user', email.trim());
        setLoading(false);

        if (error) {
            toast.error('Failed to send OTP: ' + error.message);
            return;
        }
        if (demo) {
            toast('Demo mode — OTP is 1 2 3 4 5 6 ✓', { icon: '📱', duration: 5000 });
        } else {
            toast.success('OTP sent to ' + formatted);
        }
        setStep(2);
    }

    async function handleVerifyOTP(token) {
        setLoading(true);
        const { error } = await verifyOTP(phone.replace(/\D/g, ''), token);
        setLoading(false);
        if (error) {
            toast.error(error.message || 'Wrong OTP — try again');
        } else {
            toast.success(`Welcome, ${name}! 🎉`);
        }
    }

    return (
        <div className="splash-wrapper">

            {/* LEFT / BRANDING PANEL */}
            <div className="splash-brand-panel">
                <div className="brand-header">
                    <div className="tractor-logo">🚜</div>
                    <div className="brand-name">PashuBazaar</div>
                </div>

                <h1 className="brand-title">South India's<br />trusted livestock<br />marketplace</h1>
                <div className="brand-subtitle">Connecting thousands of farmers and pet lovers across the region with safety and trust.</div>

                <div className="trust-badges">
                    <div className="trust-badge-card">
                        <div className="tb-icon">✓</div>
                        <div className="tb-content">
                            <div className="tb-title">100% Verified Listings</div>
                            <div className="tb-desc">Every animal is checked manually</div>
                        </div>
                    </div>
                    <div className="trust-badge-card">
                        <div className="tb-icon">🏛</div>
                        <div className="tb-content">
                            <div className="tb-title">Government Registered</div>
                            <div className="tb-desc">Compliant with all local regulations</div>
                        </div>
                    </div>
                    <div className="trust-badge-card">
                        <div className="tb-icon">🛡</div>
                        <div className="tb-content">
                            <div className="tb-title">Secure Transactions</div>
                            <div className="tb-desc">Protected payments and buyer safety</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT / MAIN PANEL OR FORM */}
            <div className="splash-main-panel">
                <button className="admin-nav-btn" onClick={() => navigate('/admin')}>
                    Manage App (Admin)
                </button>

                <div className="form-container">
                    {step === 1 && (
                        <div className="animate-fadeIn">
                            <h2 className="form-header-title">Pashu<span>Bazaar</span></h2>
                            <p className="form-header-sub">South India's Trusted Livestock Marketplace</p>

                            <button className="btn-google-white" onClick={handleGoogleLogin}>
                                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.33 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.67 14.62 48 24 48z" /></svg>
                                Continue with Google
                            </button>

                            <div className="divider"><span>Or continue with your profile</span></div>


                            <div className="fields-row">
                                <div className="field-col">
                                    <label className="field-lbl">Full Name</label>
                                    <input
                                        type="text"
                                        className="pb-input"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="field-col">
                                    <label className="field-lbl">Email Address</label>
                                    <input
                                        type="email"
                                        className="pb-input"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="fields-row">
                                <div className="field-col">
                                    <label className="field-lbl">Mobile Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 20, top: 14, color: '#8792a2', fontWeight: 600, fontSize: 14 }}>+91</span>
                                        <input
                                            type="tel"
                                            className="pb-input"
                                            placeholder="Mobile Number"
                                            style={{ paddingLeft: 54 }}
                                            maxLength={10}
                                            value={phone}
                                            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                </div>
                                <div className="field-col">
                                    <div className="dist-dropdown-wrap">
                                        <label className="field-lbl" style={{ display: 'block' }}>Select Your District</label>
                                        <select
                                            className="pb-select"
                                            value={district}
                                            onChange={e => setDistrict(e.target.value)}
                                        >
                                            <option value="">Choose District</option>
                                            {DISTRICTS.map(g => (
                                                <optgroup key={g.group} label={g.group}>
                                                    {g.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button className="btn-send-otp" onClick={handleSendOTP} disabled={loading}>
                                {loading ? <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000', width: 20, height: 20 }} /> : 'Send OTP →'}
                            </button>

                            {demoMode && (
                                <div className="demo-banner" style={{ background: 'rgba(255,180,0,0.15)', color: '#b27b00', padding: 8, borderRadius: 8, fontSize: 11, textAlign: 'center', marginBottom: 20, border: '1px solid rgba(255,180,0,0.3)' }}>
                                    Demo Mode · OTP is <strong>1 2 3 4 5 6</strong>
                                </div>
                            )}

                            <div className="login-legal">
                                By continuing, you agree to PashuBazaar's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="otp-screen">
                            <h2 className="form-header-title">Verify Phone</h2>
                            <p className="form-header-sub" style={{ marginBottom: 20 }}>Enter the 6-digit OTP sent to <strong>{otpPhone}</strong></p>

                            <div style={{ maxWidth: 360, margin: '0 auto 30px' }}>
                                <OTPInput onComplete={handleVerifyOTP} />
                            </div>

                            {loading && (
                                <div style={{ marginBottom: 20 }}>
                                    <span className="spinner" style={{ borderTopColor: '#194628' }} />
                                </div>
                            )}

                            <button
                                onClick={() => setStep(1)}
                                style={{ background: 'transparent', border: 'none', color: '#194628', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                            >
                                ← Change mobile number
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
