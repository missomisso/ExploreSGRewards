import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient> | null = null;

async function initClient(): Promise<SupabaseClient> {
  let url = (import.meta.env.VITE_SUPABASE_URL as string) || "";
  let anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

  if (!url || !anonKey) {
    try {
      const res = await fetch("/api/config/supabase");
      if (res.ok) {
        const cfg = await res.json();
        url = cfg.url || url;
        anonKey = cfg.anonKey || anonKey;
      }
    } catch {
      _initPromise = null;
    }
  }

  if (!url || !anonKey) {
    _initPromise = null;
    throw new Error("Supabase configuration is missing.");
  }

  _client = createClient(url, anonKey);
  return _client;
}

export function getSupabase(): Promise<SupabaseClient> {
  if (_client) return Promise.resolve(_client);
  if (!_initPromise) _initPromise = initClient();
  return _initPromise;
}

getSupabase().catch(() => {});
