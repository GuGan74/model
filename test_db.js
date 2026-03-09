import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://santdhuvceqibvfjkdjy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yg3E39vINOltmcAXvIYufQ_0WIzAOyB';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log('--- DB TEST START ---');
    try {
        const { data, error } = await supabase.from('reports').select('*').limit(1);
        if (error) {
            console.log('Error selecting reports:', error.message);
        } else {
            console.log('Success selecting reports. Count:', data.length);
        }

        const { data: listData, error: listError } = await supabase.from('listings').select('id').limit(1);
        if (listError) {
            console.log('Error selecting listings:', listError.message);
        } else {
            const firstId = listData[0]?.id || '00000000-0000-0000-0000-000000000000';
            console.log('Test Listing ID:', firstId);

            console.log('Testing insert...');
            const { error: insError } = await supabase.from('reports').insert({
                listing_id: firstId,
                reporter_id: 'd0000000-0000-0000-0000-000000000001',
                reason: 'Auto-test reason'
            });
            if (insError) {
                console.log('Insertion Error:', insError.message);
            } else {
                console.log('Insertion SUCCESS!');
            }
        }
    } catch (e) {
        console.log('Unexpected Error:', e.message);
    }
    console.log('--- DB TEST END ---');
    process.exit(0);
}

test();
setTimeout(() => { console.log('Timeout hit - exiting'); process.exit(1); }, 15000);
