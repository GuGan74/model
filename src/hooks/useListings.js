import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DEMO_LISTINGS } from '../data/demoData';

const SESSION_KEY = 'pb_listings_cache_v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;

/**
 * useListings — fetches listings with sessionStorage cache (5-min TTL),
 * 5s timeout fallback, sorting, and load-more pagination.
 *
 * Uses offsetRef (useRef) instead of state to avoid stale closure in useCallback.
 */
export function useListings() {
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // When reading cache:
    function loadCache() {
        const cachedRaw = sessionStorage.getItem(SESSION_KEY);
        if (cachedRaw) {
            try {
                const { data, ts } = JSON.parse(cachedRaw);
                if (Date.now() - ts < CACHE_TTL) {
                    return data;
                }
            } catch { /* ignore */ }
        }
        return null;
    }

    const cached = loadCache();
    const [listings, setListings] = useState(cached || DEMO_LISTINGS);
    const [loading, setLoading] = useState(!cached);
    const [hasMore, setHasMore] = useState(true);

    // ref-based offset — no stale closure
    const offsetRef = useRef(0);

    const fetchListings = useCallback(async (reset = false) => {
        const isCached = Boolean(loadCache());

        if (reset) {
            offsetRef.current = 0;
        }

        const currentOffset = offsetRef.current;
        if (!isCached || reset) setLoading(true);

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 5000)
            );
            const queryPromise = supabase
                .from('listings')
                .select('id,title,category,breed,custom_breed,gender,is_trained,is_neutered,age_years,price,location,state,milk_yield_liters,is_vaccinated,is_promoted,for_adoption,image_url,created_at')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + PAGE_SIZE - 1);

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            let newListings = [];
            if (error || !data || data.length === 0) {
                if (reset || !isCached) newListings = DEMO_LISTINGS;
                setHasMore(false);
            } else {
                newListings = data;
                setHasMore(data.length === PAGE_SIZE);
            }

            // Sort: Promoted > Vaccinated > Newest
            newListings.sort((a, b) => {
                if (a.is_promoted && !b.is_promoted) return -1;
                if (!a.is_promoted && b.is_promoted) return 1;
                if (a.is_vaccinated && !b.is_vaccinated) return -1;
                if (!a.is_vaccinated && b.is_vaccinated) return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });

            setListings(prev => {
                const updated = reset ? newListings : [...prev, ...newListings];
                // Persist fresh cache with timestamp
                if (reset || currentOffset === 0) {
                    try {
                        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data: updated, ts: Date.now() }));
                    } catch { /* ignore */ }
                }
                return updated;
            });

            offsetRef.current = currentOffset + PAGE_SIZE;
        } catch (err) {
            console.error('useListings fetch error:', err);
            if (!isCached) setListings(DEMO_LISTINGS);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const refetch = useCallback(() => fetchListings(true), [fetchListings]);
    const loadMore = useCallback(() => fetchListings(false), [fetchListings]);

    return { listings, loading, hasMore, refetch, loadMore };
}
