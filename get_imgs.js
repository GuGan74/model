import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://santdhuvceqibvfjkdjy.supabase.co', 'sb_publishable_yg3E39vINOltmcAXvIYufQ_0WIzAOyB');
async function run() {
  const { data, error } = await supabase.from('listings').select('title, image_url, id').order('created_at', { ascending: false }).limit(20);
  console.log(JSON.stringify(data.filter(d => !d.id.startsWith('d')), null, 2));
}
run();
