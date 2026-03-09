import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://santdhuvceqibvfjkdjy.supabase.co', 'sb_publishable_yg3E39vINOltmcAXvIYufQ_0WIzAOyB');
async function test() {
    console.log('--- DB TEST START ---');
    const { data: listData, error: listError } = await supabase.from('listings').select('id').limit(1);
    console.log('Listings test:', listData, listError);

    const { data, error } = await supabase.from('favorites').select('*').limit(1);
    console.log('Favorites test:', data, error);
}
test();
