"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Loader2, LogOut, Moon, Sun, Upload } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TwoFactor } from "@/components/profile/TwoFactor";
import { Friends } from "@/components/profile/Friends";
import { initialsFromName } from "@/lib/utils";
import type { Theme } from "@/lib/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-2 border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-black uppercase-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ProfileSettings() {
  const { user, profile, supabase, loading, configured, refreshProfile, signOut } =
    useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!configured) {
    return (
      <Notice tone="warn" title="Auth not configured">
        Connect Supabase to manage your profile. See the README.
      </Notice>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border-2 border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">Log in to manage your profile.</p>
        <Link
          href="/login?redirect=/profile"
          className="mt-4 inline-block border-2 border-accent bg-accent px-6 py-3 text-sm font-bold uppercase-wide text-accent-fg"
        >
          Log in
        </Link>
      </div>
    );
  }

  async function saveUsername() {
    if (!supabase || !user) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    const next = usernameRef.current?.value.trim() || null;
    const { error } = await supabase
      .from("profiles")
      .update({ username: next })
      .eq("id", user.id);
    setSaving(false);
    if (error) setErr(error.message);
    else {
      setMsg("Username saved.");
      refreshProfile();
    }
  }

  async function uploadAvatar(file: File) {
    if (!supabase || !user) return;
    setUploading(true);
    setErr(null);
    setMsg(null);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      setErr(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);
    setUploading(false);
    if (error) setErr(error.message);
    else {
      setMsg("Avatar updated.");
      refreshProfile();
    }
  }

  async function changeTheme(next: Theme) {
    setTheme(next);
    if (supabase && user) {
      await supabase.from("profiles").update({ theme: next }).eq("id", user.id);
    }
  }

  async function on2faChange(enabled: boolean) {
    if (supabase && user) {
      await supabase
        .from("profiles")
        .update({ two_factor_enabled: enabled })
        .eq("id", user.id);
      refreshProfile();
    }
  }

  return (
    <div className="space-y-6">
      {msg ? <Notice>{msg}</Notice> : null}
      {err ? <Notice tone="warn">{err}</Notice> : null}

      <Section title="Account">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-2 border-border bg-surface-2 text-lg font-black">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              initialsFromName(profile?.username ?? user.email)
            )}
          </span>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Upload size={14} />
              )}
              Upload picture
            </Button>
            <p className="mt-1 text-xs text-muted">{user.email}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            key={profile?.id ?? "anon"}
            ref={usernameRef}
            defaultValue={profile?.username ?? ""}
            placeholder="Username"
            className="flex-1 border-2 border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
          <Button onClick={saveUsername} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : "Save"}
          </Button>
        </div>
      </Section>

      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => changeTheme("dark")}
            className={`flex items-center justify-center gap-2 border-2 px-4 py-3 text-sm font-bold uppercase-wide ${
              theme === "dark"
                ? "border-accent bg-accent text-accent-fg"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            <Moon size={16} /> Dark
          </button>
          <button
            type="button"
            onClick={() => changeTheme("light")}
            className={`flex items-center justify-center gap-2 border-2 px-4 py-3 text-sm font-bold uppercase-wide ${
              theme === "light"
                ? "border-accent bg-accent text-accent-fg"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            <Sun size={16} /> Light
          </button>
        </div>
      </Section>

      <Section title="Security">
        {supabase ? <TwoFactor supabase={supabase} onChange={on2faChange} /> : null}
      </Section>

      <Section title="Subscription">
        {profile?.is_premium ? (
          <p className="flex items-center gap-2 text-sm font-bold text-lime">
            <Crown size={16} /> Premium active — analysis uses the frontier model.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">You are on the free tier.</p>
            <Link
              href="/premium"
              className="border-2 border-lime bg-lime px-4 py-2 text-sm font-bold uppercase-wide text-accent-fg"
            >
              Upgrade
            </Link>
          </div>
        )}
      </Section>

      <Section title="Friends">
        {supabase ? <Friends supabase={supabase} userId={user.id} /> : null}
      </Section>

      <Button
        variant="outline"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut size={16} /> Sign out
      </Button>
    </div>
  );
}
