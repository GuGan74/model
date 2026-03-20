import React, { useState, useEffect, startTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LIVESTOCK_CATS, PET_CATS } from '../constants/index';
import toast from 'react-hot-toast';
import './SellPage.css';
import '../pages/BoostPage.css';

const BOOST_TIERS = [
    { name: 'Basic', price: 99, period: '/7 days', badge: '', features: ['2× more views', 'Listed in search results', 'WhatsApp button shown'], color: '#3b82f6', bg: '#eff6ff', recommended: false },
    { name: 'Standard', price: 199, period: '/14 days', badge: 'POPULAR', features: ['5× more views', 'Featured on homepage', 'Priority in search', 'SMS alert to buyers'], color: '#10b981', bg: '#ecfdf5', recommended: false },
    { name: 'Premium', price: 399, period: '/30 days', badge: 'BEST VALUE', features: ['10× more views', 'Top of search results', 'Promoted badge', 'SMS + WhatsApp alerts', 'Seller verified badge'], color: '#f59e0b', bg: '#fffbeb', recommended: true },
    { name: 'Elite', price: 799, period: '/60 days', badge: '', features: ['20× more views', 'Homepage hero slot', 'All Premium benefits', 'Dedicated support'], color: '#8b5cf6', bg: '#f5f3ff', recommended: false },
];

// Fix #4: Category-specific breed lists
const BREED_OPTIONS = {
    cow: ['HF Holstein', 'Jersey', 'Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Rathi', 'Kankrej', 'Ongole', 'Hariana', 'Crossbred HF', 'Crossbred Jersey', 'Indigenous Mixed', 'Other'],
    buffalo: ['Murrah', 'Mehsana', 'Jaffarabadi', 'Surti', 'Nagpuri', 'Pandharpuri', 'Bhadawari', 'Nili-Ravi', 'Other'],
    goat: ['Boer', 'Jamunapari', 'Barbari', 'Sirohi', 'Beetal', 'Black Bengal', 'Osmanabadi', 'Malabari', 'Crossbred', 'Other'],
    sheep: ['Deccani', 'Madras Red', 'Nellore', 'Vembur', 'Bellary', 'Hassan', 'Mandya', 'Merino', 'Crossbred', 'Other'],
    horse: ['Marwari', 'Kathiawari', 'Sindhi', 'Bhutia', 'Spiti', 'Zanskari', 'Manipuri', 'Thoroughbred', 'Arabian', 'Other'],
    dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Beagle', 'Bulldog', 'Poodle', 'Rottweiler', 'Pug', 'Doberman', 'Husky', 'Indian Pariah', 'Indie (Mixed)', 'Other'],
    cat: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Indian Street Cat', 'Indie (Mixed)', 'Other'],
    bird: ['Parrot', 'Cockatiel', 'Budgerigar (Budgie)', 'Lovebird', 'Canary', 'Finch', 'Pigeon', 'Dove', 'Other'],
    fish: ['Goldfish', 'Koi', 'Betta (Fighting Fish)', 'Guppy', 'Molly', 'Angelfish', 'Oscar', 'Tetra', 'Catfish', 'Other'],
    rabbit: ['Dutch', 'Flemish Giant', 'Lionhead', 'Mini Lop', 'English Angora', 'Indian White', 'Other'],
};
function getBreedOptions(category) {
    return BREED_OPTIONS[category] || ['Other'];
}

// Fix #5 Helpers
function isLivestock(category) { return ['cow', 'buffalo', 'goat', 'sheep', 'horse'].includes(category); }
function isPet(category) { return ['dog', 'cat', 'bird', 'fish', 'rabbit'].includes(category); }
function showsMilkYield(category) { return ['cow', 'buffalo', 'goat', 'sheep'].includes(category); }
function showsPregnancyStatus(category) { return ['cow', 'buffalo', 'goat', 'horse'].includes(category); }

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
    const { currentUser, guestPrefs } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Form data
    const [listingType, setListingType] = useState('livestock');
    const [imageWarning, setImageWarning] = useState(false);
    const [form, setForm] = useState({
        category: '',
        title: '',
        breed: '',
        customBreed: '', // NEW
        gender: '',      // NEW
        is_trained: false,  // NEW
        is_neutered: false, // NEW
        age_years: '',
        weight_kg: '',
        milk_yield_liters: '',
        is_vaccinated: false,
        is_pregnant: false,
        purpose: 'dairy',
        price: '',
        village: '',
        taluk: '',
        location: '',
        landmark: '',
        state: '',
        description: '',
        image_url: '',
        for_adoption: false,
        is_promoted: false,
        boostPlanName: 'Premium',
    });

    function getWeightLimits(cat) {
        if (['cow', 'buffalo'].includes(cat)) return { min: 50, max: 1500 };
        if (['goat', 'sheep'].includes(cat)) return { min: 5, max: 150 };
        if (cat === 'dog') return { min: 2, max: 100 };
        if (cat === 'cat') return { min: 1, max: 15 };
        return { min: 1, max: 1500 };
    }

    useEffect(() => {
        if (isEditing) return;
        startTransition(() => {
            if (guestPrefs?.category === 'pets') {
                setListingType('pet');
            } else if (guestPrefs?.category === 'livestock') {
                setListingType('livestock');
            }
        });
    }, [guestPrefs?.category, isEditing]);

    // Check for edit mode on mount
    useEffect(() => {
        if (location.state?.editListing) {
            const l = location.state.editListing;
            setIsEditing(true);

            setEditingId(l.id);
            const isPet = ['dog', 'cat', 'bird', 'fish', 'rabbit'].includes(l.category);
            setListingType(isPet(l.category) ? 'pet' : 'livestock');
            setForm({
                category: l.category || '',
                title: l.title || '',
                breed: l.breed || '',
                customBreed: l.custom_breed || '',
                gender: l.gender || '',
                is_trained: l.is_trained || false,
                is_neutered: l.is_neutered || false,
                age_years: l.age_years || '',
                weight_kg: l.weight_kg || '',
                milk_yield_liters: l.milk_yield_liters || '',
                is_vaccinated: l.is_vaccinated || false,
                is_pregnant: l.is_pregnant || false,
                purpose: l.purpose || 'dairy',
                price: l.price || '',
                village: l.village || '',
                taluk: l.taluk || '',
                location: l.location || '',
                landmark: l.landmark || '',
                state: l.state || '',
                description: l.description || '',
                image_url: l.image_url || '',
                for_adoption: l.for_adoption || false,
                is_promoted: l.is_promoted || false,
                boostPlanName: 'Premium',
            });
        }
    }, [location.state]);

    function setF(key, val) { setForm(f => ({ ...f, [key]: val })); }

    async function uploadImage(file) {
        const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
        const userId = currentUser?.id || 'public';
        const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('listing-images')
                .upload(filename, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type || 'image/jpeg',
                });

            if (uploadError) {
                console.error('Image upload failed:', uploadError.message);
                if (uploadError.message?.includes('Bucket not found') ||
                    uploadError.message?.includes('not found')) {
                    toast.error('Storage not set up — run storage SQL in Supabase dashboard.', { duration: 7000 });
                } else {
                    toast.error('Image upload failed: ' + uploadError.message);
                }
                return null;
            }

            const { data } = supabase.storage
                .from('listing-images')
                .getPublicUrl(filename);

            return data.publicUrl;
        } catch (err) {
            console.error('Unexpected upload error:', err);
            toast.error('Image upload failed. Please try again.');
            return null;
        }
    }

    function validate() {
        const errs = {};
        if (!form.gender) errs.gender = 'Please select gender';
        if (form.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
        if (form.breed === 'Other' && !form.customBreed.trim()) errs.breed = 'Please specify the custom breed';
        if (!form.breed) errs.breed = 'Please select a breed';
        if (form.title.trim().length > 100) errs.title = 'Title must be under 100 characters';
        if (!form.for_adoption && Number(form.price) <= 0) errs.price = 'Please enter an asking price';
        if (form.location.trim().length < 3) errs.location = 'Please enter a valid city';
        if (!form.state) errs.state = 'Please select your state';
        if (form.description.length > 1000) errs.description = 'Description must be under 1000 characters';
        if (form.age_years !== '' && Number(form.age_years) > 25)
            errs.age = 'Age must be 25 years or less';
        if (form.weight_kg !== '') {
            const { min, max } = getWeightLimits(form.category);
            if (Number(form.weight_kg) < min || Number(form.weight_kg) > max)
                errs.weight = `Weight must be ${min}–${max} kg for this animal`;
        }
        setFieldErrors(errs);
        const firstErr = Object.values(errs)[0] || null;
        return firstErr ? { ok: false, msg: firstErr, field: Object.keys(errs)[0] } : { ok: true };
    }

    function canGoNext() {
        if (step === 1) return form.category !== '';
        if (step === 2) return form.title.trim().length >= 5 && form.breed.trim().length >= 1 && !!form.gender;
        if (step === 3) return true;
        if (step === 4) return (form.price !== '' || form.for_adoption) && form.location.trim().length > 2 && !!form.state;
        return true;
    }

    async function handleSubmit() {
        if (!currentUser) {
            toast.error('Please log in first');
            navigate('/');
            return;
        }
        const result = validate();
        if (!result.ok) {
            if (result.field === 'title') setStep(2);
            toast.error('⚠️ ' + result.msg, { duration: 4000 });
            return;
        }

        setSubmitting(true);
        try {
            // Combine address sub-fields into location string
            const locParts = [form.village.trim(), form.taluk.trim(), form.location.trim()].filter(Boolean);
            const fullLocation = locParts.join(', ') || form.location.trim();

            const payload = {
                user_id: currentUser.id,
                title: form.title.trim(),
                category: form.category,
                breed: form.breed === 'Other' ? (form.customBreed?.trim() || 'Other') : form.breed,
                custom_breed: form.breed === 'Other' ? form.customBreed.trim() : null,
                gender: form.gender,
                is_trained: form.is_trained,
                is_neutered: form.is_neutered,
                age_years: Number(form.age_years) || null,
                weight_kg: Number(form.weight_kg) || null,
                milk_yield_liters: Number(form.milk_yield_liters) || null,
                is_vaccinated: form.is_vaccinated,
                is_pregnant: form.is_pregnant,
                price: form.for_adoption ? 0 : Number(form.price),
                location: fullLocation,
                state: form.state.trim(),
                description: form.description.trim(),
                image_url: form.image_url || null,
                for_adoption: form.for_adoption,
                is_promoted: form.is_promoted,
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            // BUG #7: In edit mode, update directly — no payment required ONLY if it is already active
            if (isEditing && editingId) {
                if (location.state?.editListing?.status === 'active' || location.state?.editListing?.status === 'sold') {
                    try {
                        const { error } = await supabase
                            .from('listings')
                            .update({ ...payload, status: 'active', created_at: undefined })
                            .eq('id', editingId)
                            .eq('user_id', currentUser.id);
                        if (error) throw error;
                        toast.success('Listing updated! ✓');
                        navigate('/my-listings');
                    } catch (err) {
                        console.error('Update error:', err);
                        toast.error('Failed to update listing.');
                    }
                    return;
                }
            }

            // Create record as pending to prevent data loss on cancel
            let newListingId = isEditing ? editingId : null;
            if (!isEditing) {
                try {
                    const { data, error } = await supabase
                        .from('listings')
                        .insert(payload)
                        .select()
                        .single();
                    if (error) throw error;
                    newListingId = data.id;
                } catch (err) {
                    newListingId = 'd' + Date.now().toString().slice(-6);
                }
            } else {
                try {
                    await supabase
                        .from('listings')
                        .update({ ...payload, status: 'pending', created_at: undefined })
                        .eq('id', editingId);
                } catch (e) { }
            }

            navigate('/payment', {
                state: {
                    purpose: 'listing_fee',
                    listingPayload: payload,
                    listingFee: { name: 'Listing Fee', price: 50 },
                    boostTier: form.is_promoted ? BOOST_TIERS.find(t => t.name === form.boostPlanName) : null,
                    isEditing: true, // Tell PaymentPage to UPDATE the pending record
                    editingId: newListingId,
                }
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="sell-wrap">
            {/* Header */}
            <div className="sell-hd">
                <button className="btn-back" onClick={() => step > 1 ? setStep(s => s - 1) : navigate(isEditing ? '/my-listings' : '/')}>←</button>
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

            {step === 1 && (
                <div className="sell-section animate-fadeIn">
                    <h3>📂 What are you selling?</h3>
                    <div className="toggle-row" style={{ marginBottom: 30, marginTop: 15 }}>
                        {(guestPrefs?.category !== 'pets') && (
                            <button
                                className={`tbtn toggle-btn${listingType === 'livestock' ? ' active' : ''}`}
                                onClick={() => { setListingType('livestock'); setF('category', ''); }}
                            >
                                🐄 Cattle
                            </button>
                        )}
                        {(guestPrefs?.category !== 'livestock') && (
                            <button
                                className={`tbtn toggle-btn${listingType === 'pet' ? ' active' : ''}`}
                                onClick={() => { setListingType('pet'); setF('category', ''); }}
                            >
                                🐾 Pets
                            </button>
                        )}
                    </div>
                    <div>
                        <h4 style={{ marginBottom: 16, color: '#666' }}>
                            {listingType === 'livestock' ? 'Select Cattle Type:' : 'Select Pet Type:'}
                        </h4>
                        <div className="category-grid">
                            {(listingType === 'livestock' ? LIVESTOCK_CATS : PET_CATS).map(c => (
                                <div
                                    key={c.id}
                                    className={`category-card${form.category === c.id ? ' selected' : ''}`}
                                    onClick={() => setF('category', c.id)}
                                >
                                    <div className="cat-icon">{c.label}</div>
                                    <div className="cat-name">{c.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: Cattle Details */}
            {step === 2 && (
                <div className="animate-fadeIn">
                    <div className="fs ga">
                        <h3>📝 {listingType === 'pet' ? 'Pet Details' : 'Cattle Details'}</h3>
                        <div className="fg">
                            <div className="ff">
                                <label>Listing Title *</label>
                                <input placeholder={listingType === 'pet' ? "e.g. Golden Retriever Puppy" : "e.g. HF Cow — High Milk Yield"} value={form.title} onChange={e => setF('title', e.target.value)} maxLength={100} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    {fieldErrors.title ? <span style={{ color: '#e63946', fontSize: 12 }}>⚠️ {fieldErrors.title}</span> : <span />}
                                    <span style={{ fontSize: 11, color: form.title.length < 5 ? '#e63946' : 'var(--g3)' }}>{form.title.length}/100 (min 5)</span>
                                </div>
                            </div>
                            <div className="ff">
                                <label>Breed *</label>
                                <select value={form.breed} onChange={(e) => setF('breed', e.target.value)} style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #ccc', outline: 'none' }}>
                                    <option value="">Select Breed</option>
                                    {getBreedOptions(form.category).map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                {fieldErrors.breed && <div style={{ color: '#e63946', fontSize: 12, marginTop: 4 }}>⚠️ {fieldErrors.breed}</div>}
                                {form.breed === 'Other' && (
                                    <input type="text" placeholder="Please specify breed" value={form.customBreed} onChange={e => setF('customBreed', e.target.value)} style={{ marginTop: 8 }} />
                                )}
                            </div>
                        </div>

                        <div className="ff" style={{ marginTop: 15, marginBottom: 15 }}>
                            <label>Gender *</label>
                            <div className="radio-group" style={{ display: 'flex', gap: 16 }}>
                                <label className="radio-option">
                                    <input type="radio" name="gender" value="male" checked={form.gender === 'male'} onChange={(e) => setF('gender', e.target.value)} style={{ width: 18, height: 18 }} />
                                    <span>🚹 Male</span>
                                </label>
                                <label className="radio-option">
                                    <input type="radio" name="gender" value="female" checked={form.gender === 'female'} onChange={(e) => setF('gender', e.target.value)} style={{ width: 18, height: 18 }} />
                                    <span>🚺 Female</span>
                                </label>
                            </div>
                            {fieldErrors.gender && <span style={{ color: '#e63946', fontSize: 12, marginTop: 4, display: 'block' }}>⚠️ {fieldErrors.gender}</span>}
                        </div>

                        <div className="fg3">
                            <div className="ff">
                                <label>Age (Years)</label>
                                <input type="number" placeholder="0" value={form.age_years} onChange={e => { const v = Math.min(25, Math.max(0, Number(e.target.value))); setF('age_years', v || ''); }} min={0} max={25} />
                                <small style={{ fontSize: 11, color: 'var(--g3)' }}>Max 25 years</small>
                                {fieldErrors.age && <div style={{ color: '#e63946', fontSize: 12, marginTop: 2 }}>⚠️ {fieldErrors.age}</div>}
                            </div>
                            <div className="ff">
                                <label>Weight (kg)</label>
                                <input type="number" placeholder="0" value={form.weight_kg} onChange={e => { const lim = getWeightLimits(form.category); const v = Math.min(lim.max, Math.max(0, Number(e.target.value))); setF('weight_kg', v || ''); }} min={0} max={getWeightLimits(form.category).max} />
                                <small style={{ fontSize: 11, color: 'var(--g3)' }}>
                                    {isLivestock(form.category) ? `Range: ${getWeightLimits(form.category).min}–${getWeightLimits(form.category).max} kg` : 'Enter approx weight'}
                                </small>
                                {fieldErrors.weight && <div style={{ color: '#e63946', fontSize: 12, marginTop: 2 }}>⚠️ {fieldErrors.weight}</div>}
                            </div>
                            {showsMilkYield(form.category) && (
                                <div className="ff">
                                    <label>Milk Yield (L/day)</label>
                                    <input type="number" placeholder="0" value={form.milk_yield_liters} onChange={e => setF('milk_yield_liters', e.target.value)} min={0} />
                                    <small style={{ fontSize: 11, color: 'var(--g3)' }}>Daily production</small>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="fs oa" style={{ background: '#fff9f0', border: '1px solid #ffe8cc' }}>
                        <h3 style={{ color: '#ea580c' }}>🩺 Health & Status</h3>

                        <div className="fg" style={{ marginTop: 14 }}>
                            <div className="ff" style={{ flex: 1 }}>
                                <label style={{ color: '#9a3412', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Is it Vaccinated? *</label>
                                <select
                                    value={form.is_vaccinated ? 'yes' : 'no'}
                                    onChange={e => setF('is_vaccinated', e.target.value === 'yes')}
                                    style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #fbd38d', outline: 'none', background: 'white', fontSize: 14 }}
                                >
                                    <option value="no">Not Vaccinated</option>
                                    <option value="yes">Yes, Vaccinated</option>
                                </select>
                            </div>

                            {showsPregnancyStatus(form.category) && form.gender === 'female' && (
                                <div className="ff" style={{ flex: 1 }}>
                                    <label style={{ color: '#9a3412', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Is it Pregnant? *</label>
                                    <select
                                        value={form.is_pregnant ? 'yes' : 'no'}
                                        onChange={e => setF('is_pregnant', e.target.value === 'yes')}
                                        style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #fbd38d', outline: 'none', background: 'white', fontSize: 14 }}
                                    >
                                        <option value="no">Not Pregnant</option>
                                        <option value="yes">Yes, Currently Pregnant</option>
                                    </select>
                                </div>
                            )}

                            {isPet(form.category) && (
                                <div className="ff" style={{ flex: 1 }}>
                                    <label style={{ color: '#9a3412', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Is it Trained? *</label>
                                    <select
                                        value={form.is_trained ? 'yes' : 'no'}
                                        onChange={e => setF('is_trained', e.target.value === 'yes')}
                                        style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #fbd38d', outline: 'none', background: 'white', fontSize: 14 }}
                                    >
                                        <option value="no">Not Trained</option>
                                        <option value="yes">Yes, Well Trained</option>
                                    </select>
                                </div>
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

                        {/* Image verification warning */}
                        {imageWarning && (
                            <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#856404', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 18 }}>⚠️</span>
                                <span>Please ensure the uploaded image shows a <strong>{form.category || 'matching animal'}</strong>. Mismatched images may be rejected during review.</span>
                            </div>
                        )}

                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                // File type validation
                                const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                                if (!validTypes.includes(file.type)) {
                                    toast.error('Only JPG, PNG, or WebP images are allowed.');
                                    return;
                                }
                                // File size validation
                                if (file.size > 5 * 1024 * 1024) {
                                    toast.error('Image too large. Max 5MB.');
                                    return;
                                }
                                // Dimension validation
                                const dimOk = await new Promise(resolve => {
                                    const img = new Image();
                                    img.onload = () => {
                                        if (img.width < 300 || img.height < 300) {
                                            toast.error('Image must be at least 300×300 pixels.');
                                            resolve(false);
                                        } else { resolve(true); }
                                    };
                                    img.onerror = () => resolve(true);
                                    img.src = URL.createObjectURL(file);
                                });
                                if (!dimOk) return;
                                const tid = toast.loading('Uploading photo...');
                                const url = await uploadImage(file);
                                toast.dismiss(tid);
                                if (url) {
                                    setF('image_url', url);
                                    setImageWarning(true);
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
                        <h3>📍 Location Details</h3>
                        <div className="fg">
                            <div className="ff">
                                <label>Village</label>
                                <input placeholder="e.g. Vadavalli" value={form.village} onChange={e => setF('village', e.target.value)} />
                            </div>
                            <div className="ff">
                                <label>Taluk</label>
                                <input placeholder="e.g. Coimbatore North" value={form.taluk} onChange={e => setF('taluk', e.target.value)} />
                            </div>
                        </div>
                        <div className="fg">
                            <div className="ff">
                                <label>City *</label>
                                <input placeholder="e.g. Coimbatore" value={form.location} onChange={e => setF('location', e.target.value)} />
                                {fieldErrors.location && <div style={{ color: '#e63946', fontSize: 12, marginTop: 4 }}>⚠️ {fieldErrors.location}</div>}
                            </div>
                            <div className="ff">
                                <label>Landmark <span style={{ fontSize: 11, color: 'var(--g3)' }}>(Optional)</span></label>
                                <input placeholder="e.g. Near bus stand" value={form.landmark} onChange={e => setF('landmark', e.target.value)} />
                            </div>
                        </div>
                        <div className="fg">
                            <div className="ff">
                                <label>State *</label>
                                <select value={form.state} onChange={e => setF('state', e.target.value)}>
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                {fieldErrors.state && <div style={{ color: '#e63946', fontSize: 12, marginTop: 4 }}>⚠️ {fieldErrors.state}</div>}
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
                                onChange={e => {
                                    setF('is_promoted', e.target.checked);
                                    if (e.target.checked && !form.boostPlanName) setF('boostPlanName', 'Premium');
                                }}
                                style={{ width: '22px', height: '22px', accentColor: '#f1c40f' }}
                            />
                        </label>

                        {form.is_promoted && (
                            <div className="boost-grid animate-fadeIn" style={{ marginBottom: 20 }}>
                                {BOOST_TIERS.map(t => {
                                    const isSelected = form.boostPlanName === t.name;
                                    return (
                                        <div
                                            key={t.name}
                                            className={`boost-card ${t.recommended ? 'rec' : ''}`}
                                            onClick={() => setF('boostPlanName', t.name)}
                                            style={{
                                                cursor: 'pointer',
                                                border: isSelected ? `2.5px solid ${t.color}` : '2px solid transparent',
                                                boxShadow: isSelected ? `0 4px 12px ${t.color}33` : 'var(--sh)',
                                                transform: isSelected ? 'translateY(-3px)' : 'none'
                                            }}
                                        >
                                            <div className="bc-top">
                                                <div className="bc-nm" style={{ color: t.color }}>{t.name}</div>
                                                {t.badge && <div className="bc-badge">{t.badge}</div>}
                                            </div>
                                            <div className="bc-price" style={{ color: t.color }}>₹{t.price}</div>
                                            <div className="bc-period">{t.period}</div>
                                            <ul className="bc-feats">
                                                {t.features.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                            <div style={{ marginTop: 15, textAlign: 'center' }}>
                                                <input
                                                    type="radio"
                                                    checked={isSelected}
                                                    readOnly
                                                    style={{ width: 18, height: 18, accentColor: t.color }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
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
