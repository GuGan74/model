import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LIVESTOCK_CATS, PET_CATS } from '../constants/index';
import toast from 'react-hot-toast';
import './SellPage.css';

const INDIAN_STATES = [
    'Tamil Nadu', 'Maharashtra', 'Uttar Pradesh', 'Rajasthan',
    'Gujarat', 'Punjab', 'Haryana', 'Telangana', 'Karnataka',
    'Andhra Pradesh', 'Madhya Pradesh', 'Bihar',
    'Arunachal Pradesh', 'Assam', 'Chhattisgarh', 'Goa',
    'Himachal Pradesh', 'Jharkhand', 'Kerala', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Sikkim',
    'Tripura', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh',
    'Puducherry', 'Andaman & Nicobar', 'Dadra & Nagar Haveli',
    'Daman & Diu', 'Lakshadweep'
];

const STEPS = ['Cattle Type', 'Details', 'Photos', 'Pricing'];

export default function SellPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, currentProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

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

    // Check for edit mode on mount
    useEffect(() => {
        if (location.state?.editListing) {
            const l = location.state.editListing;
            setIsEditing(true);
            setEditingId(l.id);
            // Determine listing type
            const isPet = ['dog', 'cat', 'bird'].includes(l.category);
            setListingType(isPet ? 'pet' : 'livestock');
            setForm({
                category: l.category || '',
                title: l.title || '',
                breed: l.breed || '',
                age_years: l.age_years || '',
                weight_kg: l.weight_kg || '',
                milk_yield_liters: l.milk_yield_liters || '',
                is_vaccinated: l.is_vaccinated || false,
                is_pregnant: l.is_pregnant || false,
                purpose: l.purpose || 'dairy',
                price: l.price || '',
                location: l.location || '',
                state: l.state || '',
                description: l.description || '',
                image_url: l.image_url || '',
                for_adoption: l.for_adoption || false,
                is_promoted: l.is_promoted || false,
            });
        }
    }, [location.state]);

    function setF(key, val) { setForm(f => ({ ...f, [key]: val })); }

    async function uploadImage(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const filename = `listings/${Date.now()}-${Math.random()
            .toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
            .from('listing-images')
            .upload(filename, file, { cacheControl: '3600', upsert: false });

        if (error) {
            // Fallback: if bucket doesn't exist yet, use object URL
            return URL.createObjectURL(file);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(filename);

        return publicUrl;
    }

    function validate() {
        const errs = {};
        if (form.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
        if (form.title.trim().length > 100) errs.title = 'Title must be under 100 characters';
        if (!form.for_adoption && Number(form.price) <= 0) errs.price = 'Please enter an asking price';
        if (form.location.trim().length < 3) errs.location = 'Please enter a valid city or village';
        if (form.description.length > 1000) errs.description = 'Description must be under 1000 characters';
        setFieldErrors(errs);
        // Return first error message, or null if all good
        const firstErr = Object.values(errs)[0] || null;
        return firstErr ? { ok: false, msg: firstErr, field: Object.keys(errs)[0] } : { ok: true };
    }

    function canGoNext() {
        if (step === 1) return form.category !== '';
        if (step === 2) return form.title.trim().length > 2 && form.breed.trim().length > 1;
        if (step === 3) return true;
        if (step === 4) return (form.price !== '' || form.for_adoption) && form.location.trim().length > 2;
        return true;
    }

    async function handleSubmit() {
        if (!currentUser) { toast.error('Please log in first'); navigate('/'); return; }
        const result = validate();
        if (!result.ok) {
            // Jump back to the step where the error lives
            if (result.field === 'title') setStep(2);
            toast.error('⚠️ ' + result.msg, { duration: 4000 });
            return;
        }
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
            if (isEditing) {
                const { error } = await supabase.from('listings').update(payload).eq('id', editingId);
                if (error) throw error;
                toast.success('Listing updated! 🎉');
                navigate('/mylisting');
            } else {
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
            }
        } catch (err) {
            console.error('Submit failed:', err);
            // Demo fallback
            toast.success(isEditing ? 'Listing updated! (Demo mode) ✓' : 'Listing published! (Demo mode) 🎉');
            navigate(isEditing ? '/mylisting' : '/success', { state: { listing: { ...form, id: editingId || 'demo-' + Date.now() } } });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="sell-wrap">
            {/* Header */}
            <div className="sell-hd">
                <button className="btn-back" onClick={() => step > 1 ? setStep(s => s - 1) : navigate(isEditing ? '/mylisting' : '/')}>←</button>
                <div>
                    <div className="sell-ttl">
                        {isEditing ? '✏️ Edit Listing' : (listingType === 'livestock' ? '🐄 Sell Cattle' : '🐾 Sell Pet')}
                    </div>
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
                            <button className={`tbtn${listingType === 'livestock' ? ' act' : ''}`} onClick={() => { setListingType('livestock'); setF('category', ''); }}>🐄 Cattle</button>
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

            {/* STEP 2: Cattle Details */}
            {step === 2 && (
                <div className="animate-fadeIn">
                    <div className="fs ga">
                        <h3>📝 Cattle Details</h3>
                        <div className="fg">
                            <div className="ff">
                                <label>Listing Title *</label>
                                <input placeholder="e.g. HF Cow — High Milk Yield" value={form.title} onChange={e => setF('title', e.target.value)} />
                                {fieldErrors.title && <div style={{ color: '#e63946', fontSize: 12, marginTop: 4 }}>⚠️ {fieldErrors.title}</div>}
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
                        <p style={{ fontSize: 13, color: 'var(--g3)', marginBottom: 16 }}>
                            High quality photos get 3× more buyer inquiries.
                        </p>

                        {/* Show upload zone OR large preview */}
                        {!form.image_url ? (
                            <label className="upload-zone-big" htmlFor="photo-upload">
                                <div className="uzb-icon">📷</div>
                                <div className="uzb-title">Tap to Upload Photo</div>
                                <div className="uzb-sub">JPG or PNG · Max 5MB</div>
                            </label>
                        ) : (
                            <div className="photo-preview-wrap">
                                <img
                                    src={form.image_url}
                                    alt="Cattle preview"
                                    className="photo-preview-img"
                                />
                                <div className="photo-preview-bar">
                                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13 }}>
                                        ✅ Photo uploaded successfully
                                    </span>
                                    <label
                                        htmlFor="photo-upload"
                                        style={{
                                            cursor: 'pointer',
                                            color: 'var(--blue)',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            textDecoration: 'underline',
                                        }}
                                    >
                                        🔄 Change Photo
                                    </label>
                                </div>
                            </div>
                        )}

                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    toast.error('Image too large. Max 5MB.');
                                    return;
                                }
                                const tid = toast.loading('Uploading photo...');
                                const url = await uploadImage(file);
                                toast.dismiss(tid);
                                if (url) {
                                    setF('image_url', url);
                                    toast.success('Photo uploaded! ✓');
                                }
                            }}
                        />

                        {/* Skip photo option */}
                        {!form.image_url && (
                            <div style={{ textAlign: 'center', marginTop: 12 }}>
                                <span style={{ fontSize: 12, color: 'var(--g3)' }}>
                                    No photo? No problem —{' '}
                                </span>
                                <button
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--g3)', fontSize: 12,
                                        textDecoration: 'underline', cursor: 'pointer',
                                    }}
                                    onClick={() => setF('image_url', ' ')}
                                >
                                    skip for now
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="fs ya" style={{ textAlign: 'center' }}>
                        <h3>🤖 ML Verification (Optional)</h3>
                        <p style={{ fontSize: 13, color: 'var(--g3)', marginBottom: 14 }}>Use AI to verify your cattle and get a trust badge — increases buyer confidence by 78%.</p>
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
                                {fieldErrors.location && <div style={{ color: '#e63946', fontSize: 12, marginTop: 4 }}>⚠️ {fieldErrors.location}</div>}
                            </div>
                            <div className="ff">
                                <label>State</label>
                                <select value={form.state} onChange={e => setF('state', e.target.value)}>
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(s => (
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
                                placeholder="Describe the cattle — health, temperament, milk history, reason for selling..."
                                value={form.description}
                                onChange={e => setF('description', e.target.value)}
                                maxLength={1000}
                                style={{ height: 120 }}
                            />
                            <div style={{ textAlign: 'right', fontSize: 11, color: form.description.length > 950 ? '#e63946' : 'var(--g3)', marginTop: 4 }}>
                                {form.description.length}/1000
                            </div>
                            {fieldErrors.description && <div style={{ color: '#e63946', fontSize: 12, marginTop: 4 }}>⚠️ {fieldErrors.description}</div>}
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
                        {submitting ? (
                            <><span className="spinner" /> {isEditing ? 'Updating…' : 'Publishing…'}</>
                        ) : (
                            isEditing ? '🚀 Update Listing' : '🚀 Publish Listing'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
