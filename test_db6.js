import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://santdhuvceqibvfjkdjy.supabase.co', 'sb_publishable_yg3E39vINOltmcAXvIYufQ_0WIzAOyB');
async function run() {
  const { data, error } = await supabase.from('listings').select('id, title, image_url').order('created_at', { ascending: false }).limit(2);
  console.log(data);
}
run();
