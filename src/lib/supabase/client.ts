import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Browser Supabase client. Returns `null` when Supabase env vars are missing so
 * the UI can render a "connect Supabase" state instead of crashing.
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(env.supabaseUrl as string, env.supabaseAnonKey as string);
}
