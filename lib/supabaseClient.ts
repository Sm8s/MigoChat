// Wir kommentieren das Paket aus, um zu sehen, ob Vercel dann durchläuft
// import { createClient } from '@supabase/supabase-js';

export const supabase = {
  from: () => ({
    select: () => ({ order: () => ({ data: [], error: null }) }),
    insert: () => ({ error: null }),
  }),
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
};