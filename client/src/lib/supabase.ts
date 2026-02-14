import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. VITE_SUPABASE_URL:", supabaseUrl ? "set" : "missing", "VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "set" : "missing");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
