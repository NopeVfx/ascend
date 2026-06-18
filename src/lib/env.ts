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

  // Standard (free) tier provider.
  geminiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  aiStandardModel: process.env.AI_STANDARD_MODEL || "gemini-2.0-flash",

  // Premium tier providers. The premium analysis tries `aiPremiumProvider`
  // first, then the remaining configured providers, with OpenAI as the
  // designated final fallback.
  zaiApiKey: process.env.ZAI_API_KEY,
  zaiBaseUrl: process.env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  aiPremiumProvider: ((process.env.AI_PREMIUM_PROVIDER || "zai").toLowerCase()) as
    | "zai"
    | "anthropic"
    | "openai",
  // Per-provider premium model ids (override with the exact ids from each provider's docs).
  aiZaiModel: process.env.AI_ZAI_MODEL || "glm-4.6",
  aiAnthropicModel: process.env.AI_ANTHROPIC_MODEL || "claude-opus-4-1",
  aiOpenAiModel:
    process.env.AI_OPENAI_MODEL || process.env.AI_PREMIUM_MODEL || "gpt-4o",

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
export const isPremiumAiConfigured = Boolean(
  env.zaiApiKey || env.anthropicApiKey || env.openaiApiKey,
);
export const isAnyAiConfigured = isStandardAiConfigured || isPremiumAiConfigured;

export const isStripeConfigured = Boolean(
  env.stripeSecretKey && env.stripePublishableKey && env.stripePriceId,
);

export const isMeetingConfigured = Boolean(env.matchmakingUrl);
