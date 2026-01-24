import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL; // your Supabase URL
const supabaseKey = process.env.SUPABASE_ANON_KEY; // your Supabase anon key
export const supabase = createClient(supabaseUrl, supabaseKey);