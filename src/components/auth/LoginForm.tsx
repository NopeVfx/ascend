"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

type Mode = "signin" | "signup";
type Step = "credentials" | "mfa";

export function LoginForm() {
  const { supabase, configured } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? params.get("next") ?? "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function done() {
    router.push(redirect);
    router.refresh();
  }

  async function maybeChallengeMfa() {
    if (!supabase) return;
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data && data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        setFactorId(totp.id);
        setStep("mfa");
        setInfo("Enter the 6-digit code from your authenticator app.");
        return;
      }
    }
    done();
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Check your email to confirm your account, then log in.");
          setMode("signin");
          return;
        }
        done();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await maybeChallengeMfa();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !factorId) return;
    setError(null);
    setLoading(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge(
        { factorId },
      );
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) setError(error.message);
  }

  if (!configured) {
    return (
      <Notice tone="warn" title="Auth not configured">
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable login. See the README
        for the full setup.
      </Notice>
    );
  }

  if (step === "mfa") {
    return (
      <form onSubmit={handleVerifyMfa} className="space-y-4">
        <h1 className="text-2xl font-black uppercase-wide">Two-factor</h1>
        {info ? <Notice>{info}</Notice> : null}
        {error ? <Notice tone="warn">{error}</Notice> : null}
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full border-2 border-border bg-background px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-accent"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Verify"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black uppercase-wide">
          {mode === "signin" ? "Log in" : "Sign up"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Access analysis history, premium, and friends.
        </p>
      </div>

      {info ? <Notice>{info}</Notice> : null}
      {error ? <Notice tone="warn">{error}</Notice> : null}

      <Button variant="outline" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase-wide text-muted">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleCredentials} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full border-2 border-border bg-background px-4 py-3 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="w-full border-2 border-border bg-background px-4 py-3 outline-none focus:border-accent"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : mode === "signin" ? (
            "Log in"
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError(null);
          setInfo(null);
        }}
        className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
      >
        {mode === "signin"
          ? "No account? Sign up"
          : "Already have an account? Log in"}
      </button>
    </div>
  );
}
