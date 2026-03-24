/**
 * Calculate how many days ago a post was created
 * @param {string} createdAt - ISO date string
 * @returns {number} - Days ago
 */
export function getDaysAgo(createdAt) {
    if (!createdAt) return 0;
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get post age category with style info
 * @param {string} createdAt - ISO date string
 * @returns {object} - { category, label, className, icon, color }
 */
export function getPostAgeInfo(createdAt) {
    const days = getDaysAgo(createdAt);

    if (days <= 3) {
        const label = days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
        return {
            category: 'fresh',
            label,
            className: 'post-age-fresh',
            icon: '🔥',
            color: '#4caf50',
        };
    } else if (days <= 8) {
        return {
            category: 'recent',
            label: `${days} days ago`,
            className: 'post-age-recent',
            icon: '📅',
            color: '#2196f3',
        };
    } else {
        const label = days <= 30
            ? `${days} days ago`
            : `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
        return {
            category: 'older',
            label,
            className: 'post-age-older',
            icon: '🕒',
            color: '#9e9e9e',
        };
    }
}
