import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Demo mode: always ON (Twilio / Supabase Phone Auth not configured)
// TODO: change back to env-based check when real SMS is configured:
// const isDemoMode = () => import.meta.env.VITE_DEMO_MODE === 'true';
const isDemoMode = () => true;

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('user');
    const [demoMode] = useState(isDemoMode());

    // Temp registration storage
    const [regData, setRegData] = useState({ name: '', district: '', phone: '', email: '' });

    const loadProfile = React.useCallback(async (uid) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (data) {
            setCurrentProfile(data);
            setUserRole(data.role || 'user');
        }
    }, [setCurrentProfile, setUserRole]);

    const ensureProfile = React.useCallback(async (user) => {
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single();
        if (!existing) {
            const profileData = {
                id: user.id,
                phone: user.phone || regData.phone,
                email: user.email || regData.email || null,
                full_name: regData.name || 'User',
                location: regData.district || '',
                role: userRole || 'user',
                language: 'English',
                created_at: new Date().toISOString(),
            };
            await supabase.from('profiles').insert(profileData);
            setCurrentProfile(profileData);
        } else {
            await loadProfile(user.id);
        }
    }, [loadProfile, regData, userRole, setCurrentProfile]);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setCurrentUser(session.user);
                loadProfile(session.user.id);
                setIsLoggedIn(true);
            } else {
                // Check demo mode local storage
                try {
                    const demo = JSON.parse(localStorage.getItem('pb_demo') || 'null');
                    if (demo) {
                        setCurrentProfile(demo);
                        setCurrentUser({ id: demo.id, phone: demo.phone });
                        setUserRole(demo.role || 'user');
                        setIsLoggedIn(true);
                    }
                } catch { /* ignore */ }
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setCurrentUser(session.user);
                await ensureProfile(session.user);
                setIsLoggedIn(true);
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setCurrentProfile(null);
                setIsLoggedIn(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadProfile, ensureProfile]);



    async function sendOTP(phone, name, district, role, email) {
        setRegData({ name, district, phone, email });
        setUserRole(role || 'user');
        // Always demo mode (Twilio not configured)
        return { error: null, demo: true };
    }

    async function verifyOTP(phone, token) {
        if (demoMode) {
            if (token === '123456') {
                // Use a stable UUID-like ID based on phone so same user gets same ID
                const uid = 'a0000000-0000-0000-0000-' + phone.replace(/\D/g, '').padStart(12, '0').slice(-12);
                const profile = {
                    id: uid,
                    full_name: regData.name || 'Demo User',
                    phone,
                    email: regData.email || '',
                    location: regData.district || 'Coimbatore, Tamil Nadu',
                    role: userRole || 'user',
                    language: 'English',
                    created_at: new Date().toISOString(),
                };
                // Save profile to Supabase so listings can reference it
                try {
                    await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
                } catch { /* ignore if profiles table not ready */ }
                try { localStorage.setItem('pb_demo', JSON.stringify(profile)); } catch { /* ignore */ }
                setCurrentUser({ id: uid, phone });
                setCurrentProfile(profile);
                setIsLoggedIn(true);
                return { error: null };
            } else {
                return { error: { message: 'Wrong demo OTP — use 1 2 3 4 5 6' } };
            }
        }
        const fullPhone = phone.startsWith('+91') ? phone : '+91' + phone.replace(/^91/, '');
        const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token, type: 'sms' });
        return { error };
    }
    async function signInWithGoogle() {
        if (demoMode) {
            // Demo google login
            const uid = 'd0000000-0000-0000-0000-' + Date.now().toString().slice(-12);
            const profile = {
                id: uid,
                full_name: 'Demo Google User',
                phone: '',
                email: 'demo@example.com',
                location: 'Coimbatore, Tamil Nadu',
                role: userRole || 'user',
                language: 'English',
                created_at: new Date().toISOString(),
            };
            try { localStorage.setItem('pb_demo', JSON.stringify(profile)); } catch { /* ignore */ }
            setCurrentUser({ id: uid });
            setCurrentProfile(profile);
            setIsLoggedIn(true);
            return { error: null };
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/' },
        });
        return { error };
    }

    async function signOut() {
        if (!demoMode) {
            try { await supabase.auth.signOut(); } catch { /* ignore */ }
        }
        try {
            localStorage.removeItem('pb_demo');
            localStorage.removeItem('pb_sess');
        } catch { /* ignore */ }
        setCurrentUser(null);
        setCurrentProfile(null);
        setIsLoggedIn(false);
        setUserRole('user');
    }

    async function saveInterest(listingId, listingTitle) {
        if (!currentUser) return { error: { message: 'Not logged in' } };
        if (demoMode) return { error: null };
        return await supabase.from('interests').insert({
            user_id: currentUser.id,
            listing_id: listingId,
            listing_title: listingTitle,
            contacted_at: new Date().toISOString(),
        });
    }

    const value = {
        currentUser,
        currentProfile,
        isLoggedIn,
        loading,
        userRole,
        setUserRole,
        regData,
        demoMode,
        sendOTP,
        verifyOTP,
        signInWithGoogle,
        signOut,
        saveInterest,
        loadProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
