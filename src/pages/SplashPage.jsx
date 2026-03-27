import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';
import SEOHead from '../components/SEOHead';
import LanguageSelector from '../components/LanguageSelector';
import logoImg from '../assets/kosalai-logo-removebg-preview.png';
import loadingGif from '../assets/379.gif';
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
    const { sendOTP, verifyOTP, signInWithGoogle } = useAuth();

    const [step, setStep] = useState(1); // 1 = register, 2 = OTP
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [district, setDistrict] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpPhone, setOtpPhone] = useState('');

    async function handleGoogleLogin() {
        const { error } = await signInWithGoogle();
        if (error) {
            toast.error('Google login failed: ' + error.message);
        } else {
            toast.success('Welcome! 🎉');
            const redirectTo = sessionStorage.getItem('pb_redirect_after_login') || '/';
            sessionStorage.removeItem('pb_redirect_after_login');
            navigate(redirectTo, { replace: true });
        }
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
            const redirectTo = sessionStorage.getItem('pb_redirect_after_login') || '/';
            sessionStorage.removeItem('pb_redirect_after_login');
            navigate(redirectTo, { replace: true });
        }
    }

    return (
        <div className="splash-wrapper">
            <SEOHead
                title="Kosalai — Buy &amp; Sell Cattle with Full Trust"
                description="India's most trusted cattle marketplace. Verified cows, buffaloes, goats and pets from farmers across India."
                url="https://model-mauve.vercel.app/"
            />

            {/* Manual Language Selector for First-time users */}
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000 }}>
                <LanguageSelector />
            </div>

            {/* LEFT / BRANDING PANEL */}
            <div className="splash-brand-panel">
                <div className="brand-header">
                    <img src={logoImg} alt="Kosalai Logo" style={{ height: 48, objectFit: 'contain' }} />
                </div>

                <h1 className="brand-title">South India's<br />trusted cattle<br />marketplace</h1>
                <div className="brand-subtitle">Connecting thousands of farmers and pet lovers across the region with safety and trust.</div>

                <div className="trust-badges">
                    <div className="trust-badge-card">
                        <div className="tb-icon">✓</div>
                        <div className="tb-content">
                            <div className="tb-title">100% Verified Listings</div>
                            <div className="tb-desc">Every cattle is checked manually</div>
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
                            <h2 className="form-header-title">Ko<span>salai</span></h2>
                            <p className="form-header-sub">South India's Trusted Cattle Marketplace</p>

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

                            <div style={{
                                background: 'linear-gradient(135deg, #fff8e1, #fff3cd)',
                                border: '1.5px solid #f59e0b',
                                borderRadius: 12,
                                padding: '12px 16px',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <span style={{ fontSize: 22 }}>📱</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 13, color: '#92400e' }}>
                                        Demo Mode — No real SMS sent
                                    </div>
                                    <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>
                                        Use OTP: <strong style={{
                                            fontSize: 18,
                                            letterSpacing: 4,
                                            color: '#1a7a3c',
                                            fontFamily: 'monospace'
                                        }}>1 2 3 4 5 6</strong>
                                    </div>
                                </div>
                            </div>

                            <button className="btn-send-otp" onClick={handleSendOTP} disabled={loading}>
                                {loading ? <img src={loadingGif} alt="Loading..." style={{ width: 24, height: 24, objectFit: 'contain' }} /> : 'Send OTP →'}
                            </button>

                            <div className="login-legal">
                                By continuing, you agree to Kosalai's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="otp-screen">
                            <h2 className="form-header-title">Verify Phone</h2>
                            <p className="form-header-sub" style={{ marginBottom: 12 }}>Enter the 6-digit OTP for <strong>{otpPhone}</strong></p>

                            <div style={{
                                background: '#e8f5e9',
                                border: '2px solid #1a7a3c',
                                borderRadius: 14,
                                padding: '14px 20px',
                                marginBottom: 24,
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 700, marginBottom: 4 }}>
                                    📱 DEMO OTP — type this exactly:
                                </div>
                                <div style={{
                                    fontSize: 36,
                                    fontWeight: 900,
                                    letterSpacing: 10,
                                    color: '#1a7a3c',
                                    fontFamily: 'monospace',
                                }}>
                                    123456
                                </div>
                                <div style={{ fontSize: 11, color: '#4caf50', marginTop: 4 }}>
                                    No real SMS is sent in demo mode
                                </div>
                            </div>

                            <div style={{ maxWidth: 360, margin: '0 auto 30px' }}>
                                <OTPInput onComplete={handleVerifyOTP} />
                            </div>

                            {loading && (
                                <div style={{ marginBottom: 20 }}>
                                    <img src={loadingGif} alt="Loading..." style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                </div>
                            )}

                            <button
                                onClick={() => handleVerifyOTP('123456')}
                                disabled={loading}
                                style={{
                                    background: '#1a7a3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '14px 32px',
                                    fontSize: 16,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    width: '100%',
                                    maxWidth: 360,
                                    margin: '0 auto 16px',
                                    display: 'block',
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                ✅ Use Demo OTP (123456) — Sign In
                            </button>

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
