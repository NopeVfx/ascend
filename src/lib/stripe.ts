import Stripe from "stripe";
import { env } from "@/lib/env";

export function getStripe(): Stripe | null {
  if (!env.stripeSecretKey) return null;
  return new Stripe(env.stripeSecretKey);
}

/**
 * Display metadata for the Premium tier. The real billing amount is whatever the
 * Stripe Price (STRIPE_PRICE_ID) is set to; this label is configurable so it can
 * be kept in sync without a code change.
 */
export const PREMIUM_PLAN = {
  name: "Ascend Premium",
  priceLabel: process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL || "$19",
  interval: "month",
  blurb: "Priced to cover frontier-model inference — no rate caps, sharper reads.",
  features: [
    "Frontier premium AI model (configurable, e.g. GPT-class vision)",
    "Deeper, longer ascension roadmaps",
    "Priority analysis — no daily caps",
    "Premium badge on your profile",
  ],
} as const;
