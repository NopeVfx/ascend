/**
 * Centralized environment access. Every value is optional so the app boots and
 * degrades gracefully when a given integration has not been configured yet.
 *
 * NEXT_PUBLIC_* vars must be referenced statically so Next can inline them into
 * the client bundle, hence the explicit (verbose) property access below.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  geminiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  aiStandardModel: process.env.AI_STANDARD_MODEL || "gemini-2.0-flash",
  aiPremiumModel: process.env.AI_PREMIUM_MODEL || "gpt-4o",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripePriceId: process.env.STRIPE_PRICE_ID,

  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  peerHost: process.env.NEXT_PUBLIC_PEER_HOST,
  peerPort: process.env.NEXT_PUBLIC_PEER_PORT,
  peerPath: process.env.NEXT_PUBLIC_PEER_PATH || "/peerjs",
  peerSecure: process.env.NEXT_PUBLIC_PEER_SECURE === "true",
  matchmakingUrl: process.env.NEXT_PUBLIC_MATCHMAKING_URL,
} as const;

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey,
);

export const isStandardAiConfigured = Boolean(env.geminiApiKey);
export const isPremiumAiConfigured = Boolean(env.openaiApiKey);
export const isAnyAiConfigured = isStandardAiConfigured || isPremiumAiConfigured;

export const isStripeConfigured = Boolean(
  env.stripeSecretKey && env.stripePublishableKey && env.stripePriceId,
);

export const isMeetingConfigured = Boolean(env.matchmakingUrl);
