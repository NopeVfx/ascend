"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PREMIUM_PLAN } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/env";

export function Premium() {
  const { user, profile, loading, configured, refreshProfile } = useAuth();
  const params = useSearchParams();
  const status = params.get("status");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setError(null);
    setWorking(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setWorking(false);
    }
  }

  const isPremium = Boolean(profile?.is_premium);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {status === "success" ? (
        <Notice title="Payment received">
          Your subscription is being activated. If your badge doesn&apos;t update,{" "}
          <button onClick={() => refreshProfile()} className="underline">
            refresh
          </button>
          .
        </Notice>
      ) : null}
      {status === "cancelled" ? <Notice>Checkout cancelled.</Notice> : null}

      <div className="border-2 border-lime bg-surface p-6 brut-shadow-accent">
        <p className="flex items-center gap-2 text-sm font-bold uppercase-wide text-lime">
          <Crown size={16} /> {PREMIUM_PLAN.name}
        </p>
        <p className="mt-3 text-5xl font-black">
          {PREMIUM_PLAN.priceLabel}
          <span className="text-xl text-muted">/{PREMIUM_PLAN.interval}</span>
        </p>
        <p className="mt-2 text-sm text-muted">{PREMIUM_PLAN.blurb}</p>

        <ul className="mt-5 space-y-2">
          {PREMIUM_PLAN.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check size={16} className="mt-0.5 shrink-0 text-lime" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {!configured || !user ? (
            <Link
              href="/login?redirect=/premium"
              className="inline-block w-full border-2 border-accent bg-accent px-6 py-3 text-center text-sm font-bold uppercase-wide text-accent-fg"
            >
              Log in to subscribe
            </Link>
          ) : loading ? (
            <Button disabled className="w-full">
              <Loader2 className="animate-spin" size={16} />
            </Button>
          ) : isPremium ? (
            <p className="flex items-center justify-center gap-2 border-2 border-lime py-3 text-sm font-bold uppercase-wide text-lime">
              <Crown size={16} /> Premium active
            </p>
          ) : (
            <Button
              variant="lime"
              className="w-full"
              size="lg"
              onClick={subscribe}
              disabled={working || !isStripeConfigured}
            >
              {working ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Subscribe"
              )}
            </Button>
          )}
        </div>

        {error ? (
          <div className="mt-4">
            <Notice tone="warn">{error}</Notice>
          </div>
        ) : null}
        {!isStripeConfigured ? (
          <p className="mt-3 text-center text-xs text-muted">
            Stripe keys not set — add them to enable checkout.
          </p>
        ) : null}
      </div>
    </div>
  );
}
