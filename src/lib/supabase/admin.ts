import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role client for trusted server contexts only (e.g. Stripe webhooks).
 * Never import this into client components.
 */
export function createAdminClient(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  return createSupabaseClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
