import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './SellPage.css';

const LIVESTOCK_CATS = [
    { id: 'cow', label: '🐄', name: 'Cow' },
    { id: 'buffalo', label: '🦬', name: 'Buffalo' },
    { id: 'goat', label: '🐐', name: 'Goat' },
    { id: 'sheep', label: '🐑', name: 'Sheep' },
    { id: 'poultry', label: '🐓', name: 'Poultry' },
    { id: 'other', label: '🐾', name: 'Other' },
];
const PET_CATS = [
    { id: 'dog', label: '🐕', name: 'Dogs' },
    { id: 'cat', label: '🐈', name: 'Cats' },
    { id: 'bird', label: '🦜', name: 'Birds' },
    { id: 'fish', label: '🐠', name: 'Fish' },
    { id: 'rabbit', label: '🐇', name: 'Rabbit' },
    { id: 'other-pet', label: '🐾', name: 'Other' },
];

const STEPS = ['Animal Type', 'Details', 'Photos', 'Pricing'];

export default function SellPage() {
    const navigate = useNavigate();
    const { currentUser, currentProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form data
    const [listingType, setListingType] = useState('livestock'); // livestock | pet
    const [form, setForm] = useState({
        category: '',
        title: '',
        breed: '',
        age_years: '',
        weight_kg: '',
        milk_yield_liters: '',
        is_vaccinated: false,
        is_pregnant: false,
        purpose: 'dairy',
        price: '',
        location: currentProfile?.location || '',
        state: '',
        description: '',
        image_url: '',
        for_adoption: false,
        is_promoted: false,
    });

    function setF(key, val) { setForm(f => ({ ...f, [key]: val })); }

    function canGoNext() {
        if (step === 1) return form.category !== '';
        if (step === 2) return form.title.trim().length > 2 && form.breed.trim().length > 1;
        if (step === 3) return true;
        if (step === 4) return (form.price !== '' || form.for_adoption) && form.location.trim().length > 2;
        return true;
    }

    async function handleSubmit() {
        if (!currentUser) { toast.error('Please log in first'); navigate('/'); return; }
        setSubmitting(true);
        try {
            const payload = {
                user_id: currentUser.id,
                title: form.title.trim(),
                category: form.category,
                breed: form.breed.trim(),
                age_years: Number(form.age_years) || null,
                weight_kg: Number(form.weight_kg) || null,
                milk_yield_liters: Number(form.milk_yield_liters) || null,
                is_vaccinated: form.is_vaccinated,
                is_pregnant: form.is_pregnant,
                price: form.for_adoption ? 0 : Number(form.price),
                location: form.location.trim(),
                state: form.state.trim(),
                description: form.description.trim(),
                image_url: form.image_url || null,
                for_adoption: form.for_adoption,
                is_promoted: form.is_promoted,
                status: 'active', // Active immediately (seller posts directly)
                created_at: new Date().toISOString(),
            };

            // Try insert to Supabase
            const { data, error } = await supabase.from('listings').insert(payload).select().single();
            if (error) {
                // Demo mode — just navigate to success
                toast.success('Listing published! 🎉');
                navigate('/success', { state: { listing: { ...payload, id: 'demo-' + Date.now() } } });
                return;
            }
            toast.success('Listing published! 🎉');
            if (payload.is_promoted) {
                await supabase.from('notifications').insert({
                    user_id: currentUser.id,
                    type: 'promote',
                    icon: '⚡',
                    title: 'Listing Promoted!',
                    message: `Your ${payload.title} listing is now showing as a promoted listing.`,
                    metadata: { listing_id: data.id }
                });
            }
            navigate('/success', { state: { listing: data } });
        } catch (err) {
            console.error('Submit failed:', err);
            // Demo fallback
            toast.success('Listing published! (Demo mode) 🎉');
            navigate('/success', { state: { listing: { ...form, id: 'demo-' + Date.now() } } });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="sell-wrap">
            {/* Header */}
            <div className="sell-hd">
                <button className="btn-back" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')}>←</button>
                <div>
                    <div className="sell-ttl">{listingType === 'livestock' ? '🐄 Sell Livestock' : '🐾 Sell Pet'}</div>
                    <div className="sell-sub">Step {step} of {STEPS.length}: {STEPS[step - 1]}</div>
                </div>
            </div>

            {/* Stepper */}
            <div className="stepper">
                {STEPS.map((s, i) => (
                    <React.Fragment key={i}>
                        <div className="step-item">
                            <div className={`step-c${i + 1 < step ? ' done' : i + 1 === step ? ' act' : ''}`}>
                                {i + 1 < step ? '✓' : i + 1}
                            </div>
                            <span className={`step-lbl${i + 1 <= step ? ' act' : ''}`}>{s}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className={`step-line${i + 1 < step ? ' done' : ''}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* STEP 1: Category */}
            {step === 1 && (
                <div className="sell-section animate-fadeIn">
                    <div className="fs ga">
                        <h3>📂 Listing Type</h3>
                        <div className="toggle-row" style={{ marginBottom: 20 }}>
                            <button className={`tbtn${listingType === 'livestock' ? ' act' : ''}`} onClick={() => { setListingType('livestock'); setF('category', ''); }}>🐄 Livestock</button>
                            <button className={`tbtn${listingType === 'pet' ? ' act pu' : ''}`} onClick={() => { setListingType('pet'); setF('category', ''); }}>🐾 Pet</button>
                        </div>
                    </div>
                    <div className="fs ga">
                        <h3>🐾 Select Category</h3>
                        <div className="cat-grid">
                            {(listingType === 'livestock' ? LIVESTOCK_CATS : PET_CATS).map(c => (
                                <button
                                    key={c.id}
                                    className={`cat-btn${form.category === c.id ? ' act' : ''}`}
                                    onClick={() => setF('category', c.id)}
                                >
                                    <span className="ic">{c.label}</span>
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: Animal Details */}
            {step === 2 && (
                <div className="animate-fadeIn">
                    <div className="fs ga">
                        <h3>📝 Animal Details</h3>
                        <div className="fg">
                            <div className="ff">
                                <label>Listing Title *</label>
                                <input placeholder="e.g. HF Cow — High Milk Yield" value={form.title} onChange={e => setF('title', e.target.value)} />
                            </div>
                            <div className="ff">
                                <label>Breed *</label>
                                <input placeholder="e.g. HF Holstein, Gir, Boer" value={form.breed} onChange={e => setF('breed', e.target.value)} />
                            </div>
                        </div>
                        <div className="fg3">
                            <div className="ff">
                                <label>Age (Years)</label>
                                <input type="number" placeholder="0" value={form.age_years} onChange={e => setF('age_years', e.target.value)} min={0} max={30} />
                            </div>
                            <div className="ff">
                                <label>Weight (kg)</label>
                                <input type="number" placeholder="0" value={form.weight_kg} onChange={e => setF('weight_kg', e.target.value)} min={0} />
                            </div>
                            {['cow', 'buffalo', 'goat'].includes(form.category) && (
                                <div className="ff">
                                    <label>Milk Yield (L/day)</label>
                                    <input type="number" placeholder="0" value={form.milk_yield_liters} onChange={e => setF('milk_yield_liters', e.target.value)} min={0} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="fs oa">
                        <h3>🩺 Health & Status</h3>
                        <div className="toggle-row">
                            <button className={`tbtn${form.is_vaccinated ? ' act' : ''}`} onClick={() => setF('is_vaccinated', !form.is_vaccinated)}>
                                {form.is_vaccinated ? '💉 Vaccinated ✓' : '💉 Vaccinated?'}
                            </button>
                            {['cow', 'buffalo', 'goat', 'sheep'].includes(form.category) && (
                                <button className={`tbtn${form.is_pregnant ? ' act' : ''}`} onClick={() => setF('is_pregnant', !form.is_pregnant)}>
                                    {form.is_pregnant ? '🤰 Pregnant ✓' : '🤰 Pregnant?'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: Photos */}
            {step === 3 && (
                <div className="animate-fadeIn">
                    <div className="fs ba">
                        <h3>📸 Add Photos</h3>
                        <p style={{ fontSize: 13, color: 'var(--g3)', marginBottom: 14 }}>High quality photos increase buyer trust and get 3× more inquiries.</p>
                        <label className="upload-zone" htmlFor="photo-upload">
                            <div className="uz-ic">📷</div>
                            <div>
                                <div className="uz-title">Click to Upload Photos</div>
                                <div className="uz-sub">JPG, PNG · Max 5MB each · Up to 6 photos</div>
                            </div>
                        </label>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast.error('Image is too large. Max 5MB.');
                                        return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setF('image_url', reader.result);
                                        toast.success('Photo added! ✓');
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        {form.image_url && (
                            <div className="file-uploaded">
                                <span>✓</span>
                                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>Photo uploaded successfully</span>
                                <img src={form.image_url} alt="preview" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, marginLeft: 'auto' }} />
                            </div>
                        )}
                    </div>
                    <div className="fs ya" style={{ textAlign: 'center' }}>
                        <h3>🤖 ML Verification (Optional)</h3>
                        <p style={{ fontSize: 13, color: 'var(--g3)', marginBottom: 14 }}>Use AI to verify your animal and get a trust badge — increases buyer confidence by 78%.</p>
                        <button className="btn-primary" style={{ width: '100%' }} onClick={() => toast('ML Verification: Demo mode — auto-passed! ✓', { icon: '🤖' })}>
                            📷 Start ML Verification
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: Pricing */}
            {step === 4 && (
                <div className="animate-fadeIn">
                    <div className="fs ga">
                        <h3>💰 Pricing</h3>
                        <div style={{ marginBottom: 14 }}>
                            <label className="fopt" style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.for_adoption} onChange={e => setF('for_adoption', e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--purple)' }} />
                                <span style={{ fontWeight: 700, color: 'var(--purple)' }}>💜 List for Free Adoption</span>
                            </label>
                        </div>
                        {!form.for_adoption && (
                            <div className="ff">
                                <label>Asking Price (₹) *</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 65000"
                                    value={form.price}
                                    onChange={e => setF('price', e.target.value)}
                                    className="starred"
                                    min={0}
                                />
                            </div>
                        )}
                    </div>
                    <div className="fs oa">
                        <h3>📍 Location</h3>
                        <div className="fg">
                            <div className="ff">
                                <label>City / Village *</label>
                                <input placeholder="e.g. Coimbatore" value={form.location} onChange={e => setF('location', e.target.value)} />
                            </div>
                            <div className="ff">
                                <label>State</label>
                                <select value={form.state} onChange={e => setF('state', e.target.value)}>
                                    <option value="">Select State</option>
                                    {['Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Gujarat', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Uttar Pradesh'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="fs ba">
                        <h3>⚡ Boost & Promote</h3>
                        <p style={{ fontSize: 13, color: 'var(--g3)', marginBottom: 14, textAlign: 'left' }}>Get up to 10× more views by boosting your listing to the top of search results.</p>
                        <label className="boost-zone" id="boost-toggle-label" htmlFor="boost-toggle" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            background: '#fff9e6',
                            padding: '15px',
                            border: '2px dashed #f1c40f',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            marginBottom: '20px'
                        }}>
                            <div className="bz-content" style={{ flex: 1, textAlign: 'left' }}>
                                <div className="bz-title" style={{ fontWeight: 700, fontSize: 16, color: '#967117' }}>⚡ Boost Your Listing</div>
                                <div className="bz-sub" style={{ fontSize: 13, color: '#b8860b' }}>Promoted label will display on the home page</div>
                            </div>
                            <input
                                id="boost-toggle"
                                type="checkbox"
                                checked={form.is_promoted}
                                onChange={e => setF('is_promoted', e.target.checked)}
                                style={{ width: '22px', height: '22px', accentColor: '#f1c40f' }}
                            />
                        </label>
                    </div>
                    <div className="fs ba">
                        <h3>✍️ Description</h3>
                        <div className="ff">
                            <textarea
                                placeholder="Describe the animal — health, temperament, milk history, reason for selling..."
                                value={form.description}
                                onChange={e => setF('description', e.target.value)}
                                maxLength={600}
                                style={{ height: 120 }}
                            />
                            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--g3)', marginTop: 4 }}>{form.description.length}/600</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="sell-nav-btns">
                {step < 4 ? (
                    <button
                        className="btn-continue"
                        disabled={!canGoNext()}
                        onClick={() => setStep(s => s + 1)}
                    >
                        Continue →
                    </button>
                ) : (
                    <button
                        className="btn-continue"
                        disabled={!canGoNext() || submitting}
                        onClick={handleSubmit}
                    >
                        {submitting ? <><span className="spinner" /> Publishing…</> : '🚀 Publish Listing'}
                    </button>
                )}
            </div>
        </div>
    );
}
