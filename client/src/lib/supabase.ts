import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);




/* import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

async function initSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance;
  
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const response = await fetch("/api/config/supabase");
      if (!response.ok) {
        throw new Error("Failed to fetch Supabase config");
      }
      const config = await response.json();
      
      supabaseInstance = createClient(config.url, config.anonKey);
      return supabaseInstance;
    } catch (error) {
      console.error("Failed to initialize Supabase:", error);
      supabaseInstance = createClient("", "");
      return supabaseInstance;
    }
  })();
  
  return initPromise;
}

export const getSupabase = initSupabase;

export const supabase = createClient(
  (window as any).__SUPABASE_URL__ || "",
  (window as any).__SUPABASE_ANON_KEY__ || ""
); */
