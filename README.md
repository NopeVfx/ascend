# Ascend

A dark-mode, brutalist-inspired web app for aesthetic optimization and peer-to-peer
advice. Built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, **Supabase**,
**Google Gemini / OpenAI**, **PeerJS (WebRTC)**, and **Stripe**.

Every integration is optional — the app boots and degrades gracefully, surfacing a
"connect this service" state wherever a key is missing.

## Features

1. **Auth & Profiles** — Supabase Auth (Google + email/password), optional TOTP 2FA
   (off by default), username, avatar upload, and a dark/light theme toggle (dark by
   default, persisted to the profile).
2. **AI Face Analyzer** — Upload a photo and/or type a prompt. Returns a PSL /10
   rating, per-feature sub-scores, genuine strengths, and a prioritized, evidence-based
   ascension plan. Free tier uses Gemini; premium routes to OpenAI.
3. **Meeting Room** — Omegle-style random video pairing over PeerJS WebRTC with a
   small matchmaking signaling server. Start / Next / Stop, mic & camera toggles, and
   an Add Friend button (prompts login if signed out).
4. **Premium** — Stripe Checkout subscription. A successful purchase flips
   `is_premium = true` via webhook, which upgrades the user's AI model.

## Tech stack

- Next.js 16 (App Router, Turbopack, `proxy.ts` convention)
- Tailwind CSS v4 with CSS-variable theming
- Supabase (`@supabase/ssr`) for auth, Postgres, and avatar storage
- `@google/generative-ai` (standard tier) and `openai` (premium tier)
- PeerJS + `ws` matchmaking server (`server/index.mjs`)
- Stripe Checkout + webhooks

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in whatever you have
npm run dev                  # Next.js app on http://localhost:3000
npm run server               # matchmaking/PeerJS server on :3001 (separate terminal)
```

### Environment

See `.env.example` for the full, documented list. Nothing is required to boot; add
keys to light up each feature:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`
- **AI**: `GOOGLE_GENERATIVE_AI_API_KEY` (free), `OPENAI_API_KEY` (premium);
  models are configurable via `AI_STANDARD_MODEL` / `AI_PREMIUM_MODEL`
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`
- **Meeting**: `NEXT_PUBLIC_MATCHMAKING_URL` (+ optional `NEXT_PUBLIC_PEER_*`)

> The model names are deliberately env-configurable. "Claude Opus 4.8" / "GPT-5.5"
> referenced in the brief don't exist yet — set `AI_PREMIUM_MODEL` to whatever
> frontier model you want once it's available, no code change required.

### Supabase setup

Run [`supabase/schema.sql`](./supabase/schema.sql) in your project's SQL editor. It
creates the `profiles` and `friendships` tables, RLS policies, a profile-on-signup
trigger, and a public `avatars` storage bucket. For Google OAuth, add
`<site>/auth/callback` as a redirect URL in the Supabase Auth settings.

### Stripe setup

1. Create a recurring **Price** and set `STRIPE_PRICE_ID`.
2. Point a webhook at `<site>/api/stripe/webhook` for
   `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted`; set `STRIPE_WEBHOOK_SECRET`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run server` | Matchmaking + PeerJS signaling server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Project layout

```
src/
  app/            routes (home, login, analyzer, meeting, premium, profile) + api/
  components/     shell (nav), providers, ui, and feature components
  lib/            env, types, utils, supabase clients, ai router, stripe helpers
  proxy.ts        session refresh + protected-route guard (Next 16 proxy)
server/index.mjs  Express + ws matchmaking and PeerJS signaling
supabase/         schema.sql
```
