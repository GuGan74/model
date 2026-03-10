import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DEMO_LISTINGS } from '../data/demoData';

const SESSION_KEY = 'pb_listings_cache';
const PAGE_SIZE = 20;

/**
 * useListings — fetches listings with sessionStorage cache, 5s timeout,
 * and load-more pagination.
 *
 * Fix: useRef for offset tracking to avoid stale closure bug.
 * The old [offset] dependency caused fetchListings to see a stale
 * offset value when React batched state updates during "Load More".
 */
export function useListings() {
    const cachedRaw = sessionStorage.getItem(SESSION_KEY);
    const initialListings = cachedRaw ? JSON.parse(cachedRaw) : DEMO_LISTINGS;

    const [listings, setListings] = useState(initialListings);
    const [loading, setLoading] = useState(!cachedRaw);
    const [hasMore, setHasMore] = useState(true);

    // Use a ref instead of state for offset — avoids stale closure in useCallback
    const offsetRef = useRef(0);

    const fetchListings = useCallback(async (reset = false) => {
        const hasCachedData = Boolean(sessionStorage.getItem(SESSION_KEY));

        if (reset) {
            // Reset offset synchronously via ref before any async work
            offsetRef.current = 0;
        }

        const currentOffset = offsetRef.current;
        if (!hasCachedData || reset) setLoading(true);

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 5000)
            );
            const queryPromise = supabase
                .from('listings')
                .select('id,title,category,breed,age_years,price,location,state,milk_yield_liters,is_vaccinated,is_promoted,for_adoption,image_url,created_at')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + PAGE_SIZE - 1);

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            let newListings = [];
            if (error || !data || data.length === 0) {
                if (reset || !hasCachedData) newListings = DEMO_LISTINGS;
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
                if (reset || currentOffset === 0) {
                    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated)); } catch (_) { }
                }
                return updated;
            });

            // Advance offset ref AFTER successful fetch
            offsetRef.current = currentOffset + PAGE_SIZE;
        } catch (err) {
            console.error('useListings fetch error:', err);
            if (!hasCachedData) setListings(DEMO_LISTINGS);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
        // No offset in deps — we read it via ref to avoid stale closures
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const refetch = useCallback(() => fetchListings(true), [fetchListings]);
    const loadMore = useCallback(() => fetchListings(false), [fetchListings]);

    return { listings, loading, hasMore, refetch, loadMore };
}
