import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Server Supabase client bound to the request cookies. `cookies()` is async in
 * Next 16, hence this helper is async too. Returns `null` when unconfigured.
 */
export async function createClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(
    env.supabaseUrl as string,
    env.supabaseAnonKey as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; session refresh is handled by proxy.
          }
        },
      },
    },
  );
}
