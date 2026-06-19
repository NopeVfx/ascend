"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Crown,
  ScanFace,
  ShieldCheck,
  Video,
  User,
} from "lucide-react";
import { PREMIUM_PLAN } from "@/lib/stripe";

const FEATURES = [
  {
    href: "/analyzer",
    icon: ScanFace,
    title: "AI Face Analyzer",
    body: "Upload a photo and get an unsugarcoated PSL /10 rating, per-feature sub-scores, and a prioritized ascension plan grounded in evidence.",
    cta: "Analyze my face",
  },
  {
    href: "/meeting",
    icon: Video,
    title: "Meeting Room",
    body: "Get paired randomly with peers over video for live, honest advice. Skip, stop, or add a friend mid-call — Omegle-style, looksmaxxing focused.",
    cta: "Enter the room",
  },
  {
    href: "/premium",
    icon: Crown,
    title: "Premium AI",
    body: "Route your analysis through a frontier model for deeper reads and longer roadmaps. No daily caps.",
    cta: "See premium",
  },
];

const STEPS = [
  "Upload a clear, front-lit photo or describe your goal.",
  "The AI scores harmony, jawline, eyes, skin, hair, and leanness.",
  "Execute the ascension plan — free at-home steps first, clinical later.",
  "Re-scan to track measurable progress over time.",
];

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      const supabase = createClient();
      
      // Safety check inside the async function to satisfy TypeScript
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        setProfile(profileData);
      }
      setLoading(false);
    };

    getUserData();

    const supabase = createClient();
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
          if (!session?.user) {
            setProfile(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  // --- LOGGED IN VIEW ---
  if (user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8 md:py-16">
        <div className="card-bubbly bg-surface p-8 mb-8 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={profile?.avatar_url || "https://via.placeholder.com/80"} 
            alt="Avatar" 
            className="w-20 h-20 rounded-full border-2 border-accent object-cover" 
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
              Welcome back, {profile?.username || "User"}
            </h1>
            <p className="text-sm text-muted uppercase-wide mt-1">
              {profile?.is_premium ? (
                <span className="inline-flex items-center gap-1 text-accent">
                  <Crown size={14} /> Premium Member
                </span>
              ) : (
                "Free Tier"
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/analyzer"
            className="card-bubbly p-6 flex flex-col items-center gap-3 text-center hover:bg-zinc-900"
          >
            <ScanFace size={40} className="text-accent" />
            <span className="text-lg font-black uppercase-wide">AI Analyzer</span>
            <span className="text-xs text-muted">Get your PSL rating & ascension plan</span>
          </Link>
          
          <Link
            href="/meeting"
            className="card-bubbly p-6 flex flex-col items-center gap-3 text-center hover:bg-zinc-900"
          >
            <Video size={40} className="text-accent" />
            <span className="text-lg font-black uppercase-wide">Meeting Room</span>
            <span className="text-xs text-muted">Talk to strangers & get live advice</span>
          </Link>
          
          <Link
            href="/profile"
            className="card-bubbly p-6 flex flex-col items-center gap-3 text-center hover:bg-zinc-900"
          >
            <User size={40} className="text-accent" />
            <span className="text-lg font-black uppercase-wide">Profile</span>
            <span className="text-xs text-muted">Manage account & themes</span>
          </Link>
        </div>
      </div>
    );
  }

  // --- LOGGED OUT VIEW (Original Landing Page with Bubbly UI) ---
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8 md:py-16">
      {/* Hero */}
      <section className="card-bubbly p-6 md:p-12">
        <p className="mb-4 inline-block btn-bubbly px-3 py-1 text-xs font-bold uppercase-wide text-accent bg-surface">
          Data-driven looksmaxxing
        </p>
        <h1 className="text-5xl font-black leading-[0.95] tracking-tighter md:text-7xl">
          MAX OUT
          <br />
          YOUR FACE.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          Ascend is a brutally honest aesthetic optimization engine. Get a
          measured read on where you stand and an evidence-based plan to ascend.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="btn-bubbly inline-flex items-center gap-2 bg-accent px-6 py-3.5 text-sm font-bold uppercase-wide text-accent-fg"
          >
            Start free analysis <ArrowRight size={18} />
          </Link>
          <Link
            href="/meeting"
            className="btn-bubbly inline-flex items-center gap-2 bg-surface px-6 py-3.5 text-sm font-bold uppercase-wide text-muted hover:text-accent"
          >
            <Video size={18} /> Meeting room
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.href}
              href={f.href}
              className="card-bubbly group flex flex-col p-6"
            >
              <Icon size={28} className="text-accent" />
              <h2 className="mt-4 text-xl font-black uppercase-wide">
                {f.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {f.body}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold uppercase-wide text-accent">
                {f.cta} <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </section>

      {/* How it works */}
      <section className="mt-6 card-bubbly p-6 md:p-10">
        <h2 className="text-2xl font-black uppercase-wide">The protocol</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={i} className="card-bubbly p-4">
              <span className="text-3xl font-black text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Premium teaser */}
      <section className="mt-6 card-bubbly flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center md:p-10">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase-wide text-lime">
            <Crown size={16} /> {PREMIUM_PLAN.name}
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase-wide">
            {PREMIUM_PLAN.priceLabel}
            <span className="text-base text-muted">/{PREMIUM_PLAN.interval}</span>
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {PREMIUM_PLAN.blurb}
          </p>
        </div>
        <Link
          href="/premium"
          className="btn-bubbly inline-flex items-center gap-2 bg-lime px-6 py-3.5 text-sm font-bold uppercase-wide text-accent-fg"
        >
          Go premium <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="mt-10 flex items-center gap-2 text-xs text-muted">
        <ShieldCheck size={14} />
        Advice is informational and not a substitute for medical or mental-health
        guidance.
      </footer>
    </div>
  );
}
