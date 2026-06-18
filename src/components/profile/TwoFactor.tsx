"use client";

import { useEffect, useState } from "react";
import type { Factor, SupabaseClient } from "@supabase/supabase-js";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

interface EnrollState {
  factorId: string;
  qr: string;
  secret: string;
}

export function TwoFactor({
  supabase,
  onChange,
}: {
  supabase: SupabaseClient;
  onChange: (enabled: boolean) => void;
}) {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<EnrollState | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      if (!cancelled) setFactors(data?.totp ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, version]);

  const enabled = factors.some((f) => f.status === "verified");

  async function startEnroll() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `ascend-${Date.now()}`,
    });
    setLoading(false);
    if (error || !data) {
      setError(error?.message ?? "Could not start enrollment.");
      return;
    }
    setEnrolling({
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function verifyEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling) return;
    setError(null);
    setLoading(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: enrolling.factorId,
    });
    if (cErr || !challenge) {
      setError(cErr?.message ?? "Challenge failed.");
      setLoading(false);
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: enrolling.factorId,
      challengeId: challenge.id,
      code,
    });
    setLoading(false);
    if (vErr) {
      setError(vErr.message);
      return;
    }
    setEnrolling(null);
    setCode("");
    onChange(true);
    setVersion((v) => v + 1);
  }

  async function disableAll() {
    setLoading(true);
    for (const f of factors) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setLoading(false);
    setEnrolling(null);
    onChange(false);
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm">
          <ShieldCheck size={16} className={enabled ? "text-lime" : "text-muted"} />
          Two-factor authentication
          <span
            className={`border-2 px-2 py-0.5 text-xs font-bold uppercase-wide ${
              enabled ? "border-lime text-lime" : "border-border text-muted"
            }`}
          >
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </span>
        {enabled ? (
          <Button size="sm" variant="danger" onClick={disableAll} disabled={loading}>
            Disable
          </Button>
        ) : !enrolling ? (
          <Button size="sm" variant="outline" onClick={startEnroll} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={14} /> : "Enable"}
          </Button>
        ) : null}
      </div>

      {error ? <Notice tone="warn">{error}</Notice> : null}

      {enrolling ? (
        <form onSubmit={verifyEnroll} className="space-y-3 border-2 border-border p-4">
          <p className="text-sm text-muted">
            Scan the QR with your authenticator app, then enter the 6-digit code.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enrolling.qr}
              alt="2FA QR code"
              className="h-40 w-40 border-2 border-border bg-white"
            />
            <div className="text-xs">
              <p className="text-muted">Manual key</p>
              <code className="break-all">{enrolling.secret}</code>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-32 border-2 border-border bg-background px-3 py-2 text-center tracking-[0.4em] outline-none focus:border-accent"
            />
            <Button type="submit" disabled={loading || code.length !== 6}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Verify"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEnrolling(null);
                setCode("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
