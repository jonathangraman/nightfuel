# NightFuel

Personal dinner planning with React, Vite, Supabase, and Claude. Includes weekday
and weekend planners, a protein/sauce/side builder, salads, recipes, favorites,
ratings, notes, groceries, and optional Unsplash photos.

## Setup

Use Node 24 (or Node >=22.12), then `npm ci`.
Copy `.env.example` to `.env.local` and fill in your own project values.
Never put the Anthropic secret or a Supabase service-role key in a `VITE_` variable.
The Supabase public/anon key is designed to be visible in the browser; row-level
security protects the records.

- `npm run dev`: frontend only. Meal building/local storage work; AI needs the API.
- `npx vercel dev`: frontend plus the authenticated AI endpoint. Use this for
  full local testing after linking the Vercel project and configuring its variables.
- `npm test`: regression suite, using mocked services (no paid AI requests).
- `npm run lint` and `npm run build`: pre-deployment checks.

## Deploy to Vercel

Import the repository as a Vite project; `vercel.json` defines the build and API.
Set these variables for each intended environment and redeploy:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL (also used by the server) |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase key (also used by the server) |
| `ANTHROPIC_API_KEY` | Server-only Anthropic secret |
| `ANTHROPIC_MODEL` | Optional model override; defaults to `claude-sonnet-4-6` |
| `NIGHTFUEL_ALLOWED_EMAIL` | Required: your sign-in email; restricts AI access to that account |

The server also accepts `SUPABASE_URL` / `SUPABASE_ANON_KEY`, and the earlier
`VITE_SB_URL` / `VITE_SB_KEY` aliases. Browser-only legacy Supabase configuration
is insufficient to authenticate AI requests: configure the server environment too.

For a new Supabase project, run `supabase-schema.sql`. The script preserves existing
tables and data. An existing user-scoped installation does **not** require a schema
change for this release. Earlier household_id-based schemas require a separate,
backed-up migration; this script does not drop or transform them.

In Supabase Auth, set the Site URL, allow your site's `/?recovery=1` redirect, and
turn off new user signups for personal use. The app uses your existing email/password
account and includes a complete password-reset flow.

## Persistence and upgrades

All current app data is stored as one versioned snapshot in `nf_week.data`, with
weekday keys retained alongside `_nightfuel` metadata. On first load, the app imports
legacy cloud favorites/history and local-only notes/settings. If the legacy browser and cloud copies differ, the app preserves both and asks which to keep. Existing legacy rows
and browser keys remain as recovery backups. No `nf_settings` table is required.

The browser cache is scoped to the signed-in user. Offline edits remain marked as
unsaved across reloads. Cloud writes compare the previous `updated_at` value so a
stale device cannot silently overwrite a newer plan. Conflicts offer a choice and
back up both copies locally. A failed sync remains visible with a retry button.
Avoid using old app versions concurrently; older clients cannot preserve the new
snapshot fields. Reload open tabs after deployment.

The AI endpoint verifies the Supabase session, restricts the email,
validates payloads, caps output at 8,000 tokens, and applies request timeouts.
The 12-requests/minute limiter is per server instance, not a distributed billing
quota. Keep provider spending controls enabled; use Vercel rate-limit rules or a
shared limiter before offering this publicly.

Nutrition values are estimates. The manual builder uses catalog serving sizes;
AI recipes request quantities for four servings and per-serving nutrition including
sides. Older saved recipes are preserved and may lack quantities.

Optional meal photos use an Unsplash public access key entered in Settings.

## Structure

- `src/App.jsx`: authentication, navigation, and meal actions
- `src/lib/useMealStore.js`: local persistence, cloud sync, conflict recovery
- `src/lib/mealState.js`: versioned storage and legacy migration
- `src/lib/ai.js`: authenticated AI requests and recipe validation
- `src/components/`: planners, builders, recipes, groceries, and sign-in UI
- `src/data/`: local protein, sauce, salad, and seasonal catalogs
- `api/claude.js`: authenticated Vercel server function
- `tests/`: storage, UI-flow, and endpoint regression tests
