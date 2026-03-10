// Supabase Edge Function — dynamic sitemap generator
// Deploy: supabase functions deploy sitemap
// URL: https://<project>.supabase.co/functions/v1/sitemap

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STATIC_ROUTES = ['/', '/search', '/sell', '/price-trends'];
const BASE_URL = 'https://model-mauve.vercel.app';

Deno.serve(async (_req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let dynamicUrls = '';
    try {
        const { data } = await supabase
            .from('listings')
            .select('id, created_at')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1000);

        dynamicUrls = (data || []).map(l => `
    <url>
        <loc>${BASE_URL}/listing/${l.id}</loc>
        <lastmod>${new Date(l.created_at).toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`).join('');
    } catch (e) {
        console.error('Sitemap listing fetch error:', e);
    }

    const staticUrls = STATIC_ROUTES.map((path, i) => `
    <url>
        <loc>${BASE_URL}${path}</loc>
        <changefreq>${i === 0 ? 'daily' : 'weekly'}</changefreq>
        <priority>${i === 0 ? '1.0' : '0.8'}</priority>
    </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${dynamicUrls}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
        status: 200,
    });
});
