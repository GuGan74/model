import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://santdhuvceqibvfjkdjy.supabase.co', 'sb_publishable_yg3E39vINOltmcAXvIYufQ_0WIzAOyB');
async function test() {
    const { data, error } = await supabase.from('favorites').select('id').limit(1);
    console.log('Favorites test error:', error?.message || 'NONE', 'Data:', data);
}
test();
