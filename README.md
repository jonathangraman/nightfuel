# NightFuel

Personal dinner planning with React, Vite, Supabase, and OpenAI. Includes weekday
and weekend planners, a protein/sauce/side builder, salads, recipes, favorites,
ratings, notes, groceries, and optional Unsplash photos.

## Setup

Use Node 24 (or Node >=22.12), then `npm ci`.
Copy `.env.example` to `.env.local` and fill in your own project values.
Never put the OpenAI secret or a Supabase service-role key in a `VITE_` variable.
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
| `OPENAI_API_KEY` | Server-only OpenAI secret |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-4.1-mini` |
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

Meal planning data is stored as one versioned snapshot in `nf_week.data`, with
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

## Cookbook setup and behavior

Run `supabase-cookbook.sql` in the existing Supabase project's SQL editor before deploying the cookbook update. It creates `nf_recipes` with owner-only row-level security and leaves the existing meal tables untouched. There are no seeded recipes. Signed-out users cannot access recipe records.

The Cookbook supports manual recipe entry/editing, cuisine and course filters (including appetizers and desserts), author search, source links and book/page references. Existing favorites can be copied into an editable draft; ingredients from those older recipes need their quantities separated manually before serving adjustments are useful. All saves require an explicit click. Failed saves retain the editor, and concurrent edits are rejected rather than overwriting newer records.

Choose a serving count and weekday or weekend day to schedule a recipe snapshot. Existing planned meals are explicitly labeled as replacements. Editing a cookbook recipe later does not change an already scheduled snapshot. The current planner has one meal slot per day. Ingredient quantities scale; quantities in instruction text, cooking times, and pan sizes do not scale automatically. Grocery totals combine matching ingredient names and units; incompatible units and older free-text ingredients remain separate.

“Make it healthier” uses the existing authenticated AI endpoint and opens a draft for review. Saving creates a separate recipe with original recipe/author references. It never overwrites or automatically saves the original. Nutrition is not invented for manual recipes or adaptations; recipes lacking nutrition are excluded from the nutrition summary. Link/screenshot extraction and a Discover catalog are future additions; source links in this version are references only.

## Source files

- `src/App.jsx`: authentication, navigation, and meal actions
- `src/lib/useMealStore.js`: local persistence, cloud sync, conflict recovery
- `src/lib/mealState.js`: versioned storage and legacy migration
- `src/lib/ai.js`: authenticated AI requests and recipe validation
- `src/components/`: planners, builders, recipes, groceries, and sign-in UI
- `src/data/`: local protein, sauce, salad, and seasonal catalogs
- `api/ai.js`: authenticated Vercel server function
- `tests/`: storage, UI-flow, and endpoint regression tests
