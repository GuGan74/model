import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useFavorites — batch fetches all liked listing IDs in ONE query (no N+1).
 * @param {string|null} userId
 * @param {string[]} listingIds
 * @returns {{ likedIds: Set<string>, toggleFavorite: Function }}
 */
export function useFavorites(userId, listingIds = []) {
    const [likedIds, setLikedIds] = useState(new Set());

    useEffect(() => {
        if (!userId || listingIds.length === 0) return;

        // Filter out demo IDs (start with 'd' and shorter than 10 chars)
        const realIds = listingIds.filter(id => !(String(id).startsWith('d') && String(id).length < 10));
        if (realIds.length === 0) return;

        // Single batch query instead of N queries
        supabase
            .from('favorites')
            .select('listing_id')
            .eq('user_id', userId)
            .in('listing_id', realIds)
            .then(({ data }) => {
                if (data) {
                    setLikedIds(new Set(data.map(f => f.listing_id)));
                }
            });
    }, [userId, listingIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    async function toggleFavorite(listingId, listing, currentProfile) {
        if (!userId) return { error: { message: 'Not logged in' } };

        const isDemo = String(listingId).startsWith('d') && String(listingId).length < 10;
        const isCurrentlyLiked = likedIds.has(listingId);

        if (isCurrentlyLiked) {
            setLikedIds(prev => { const s = new Set(prev); s.delete(listingId); return s; });
            if (!isDemo) {
                await supabase.from('favorites').delete()
                    .eq('user_id', userId).eq('listing_id', listingId);
            }
        } else {
            setLikedIds(prev => new Set([...prev, listingId]));
            if (!isDemo) {
                await supabase.from('favorites').insert({ user_id: userId, listing_id: listingId });
                // Notify owner
                if (listing?.user_id && listing.user_id !== userId) {
                    await supabase.from('notifications').insert({
                        user_id: listing.user_id,
                        actor_id: userId,
                        type: 'like',
                        icon: '❤️',
                        title: 'New Like on your listing!',
                        message: `${currentProfile?.full_name || 'Someone'} liked your ${listing.title}.`,
                        metadata: { listing_id: listingId }
                    });
                }
            }
        }
    }

    return { likedIds, toggleFavorite };
}
