import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_IMAGE = 'https://model-mauve.vercel.app/og-image.png';
const SITE_NAME = 'PashuBazaar';

export default function SEOHead({ title, description, imageUrl, url }) {
    const fullTitle = title || 'Buy & Sell Cattle in India | PashuBazaar';
    const fullDesc = description || "India's trusted marketplace for cows, buffaloes, goats, horses and pets. Verified listings from farmers across India.";
    const image = imageUrl || DEFAULT_IMAGE;
    const canonical = url || 'https://model-mauve.vercel.app/';

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={fullDesc} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={fullDesc} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={canonical} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={fullDesc} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
