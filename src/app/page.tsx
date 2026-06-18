import Link from "next/link";
import {
  ArrowRight,
  Crown,
  ScanFace,
  ShieldCheck,
  Video,
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
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8 md:py-16">
      {/* Hero */}
      <section className="border-2 border-border bg-surface p-6 md:p-12">
        <p className="mb-4 inline-block border-2 border-border px-3 py-1 text-xs font-bold uppercase-wide text-accent">
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
            href="/analyzer"
            className="inline-flex items-center gap-2 border-2 border-accent bg-accent px-6 py-3.5 text-sm font-bold uppercase-wide text-accent-fg transition-all hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px]"
          >
            Start free analysis <ArrowRight size={18} />
          </Link>
          <Link
            href="/meeting"
            className="inline-flex items-center gap-2 border-2 border-border bg-surface px-6 py-3.5 text-sm font-bold uppercase-wide transition-colors hover:border-accent hover:text-accent"
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
              className="group flex flex-col border-2 border-border bg-surface p-6 transition-all hover:border-accent hover:brut-shadow-accent"
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
      <section className="mt-6 border-2 border-border bg-surface p-6 md:p-10">
        <h2 className="text-2xl font-black uppercase-wide">The protocol</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={i} className="border-2 border-border p-4">
              <span className="text-3xl font-black text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Premium teaser */}
      <section className="mt-6 flex flex-col items-start justify-between gap-6 border-2 border-lime bg-surface p-6 md:flex-row md:items-center md:p-10">
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
          className="inline-flex items-center gap-2 border-2 border-lime bg-lime px-6 py-3.5 text-sm font-bold uppercase-wide text-accent-fg transition-all hover:brightness-110"
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
