# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (HTTPS, opens browser)
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier
```

To build as PWA: `quasar build -m pwa`

## Environment

Copy `.env.example` to `.env` and fill in:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** Quasar v2 (Vue 3) + Pinia + Supabase + Vue I18n + ApexCharts. Pure JavaScript (no TypeScript). Mobile-first PWA.

**Two user roles** with separate layouts, routes, and pages:
- `trainer` → `TrainerLayout.vue`, routes under `/trainer/*`
- `athlete` → `AthleteLayout.vue`, routes under `/athlete/*`

Auth routes (`/auth/login`, `/auth/register`) use `MainLayout.vue`. The router guard in `src/router/index.js` enforces authentication and role-based access — it redirects unauthenticated users to login, and prevents cross-role navigation.

**Boot files** (`src/boot/`):
- `supabase.js` — creates and exports the Supabase client; import `supabase` from here in stores
- `apexcharts.js` — registers `vue3-apexcharts` globally
- `i18n.js` — sets up Vue I18n

**Pinia stores** (`src/stores/`) — each store calls Supabase directly:
- `auth.js` — session, user profile, `isTrainer`/`isAthlete` computed, `init()` sets up `onAuthStateChange`
- `programs.js` — trainer-side: manage programs, phases, splits, exercises. Data model: `programs → program_phases → training_splits → split_exercises → exercises`
- `sessions.js` — athlete-side: workout sessions, exercise logging, achievements/gamification, streak computation, next-split rotation logic
- `measurements.js` — body measurements for athlete progress charts
- `schedule.js` — gym open/closed schedule (`gym_schedule` + `gym_exceptions` tables)
- `exercises.js` — exercise library

**Supabase data model (key tables):**
- `profiles` — extends `auth.users`; has `role` field (`trainer` | `athlete`). A DB trigger creates the profile on signup with `role = 'athlete'`; trainer role requires an explicit update.
- `programs` — links `trainer_id` + `athlete_id`; has `active` boolean
- `program_phases` → `training_splits` → `split_exercises` → `exercises`
- `workout_sessions` — `athlete_id`, `split_id`, `session_date`, `completed`
- `exercise_logs` — per-session per-exercise log (sets, reps, weight)
- `achievements` — gamification badges (`first_session`, `streak_7`, `10_sessions`)
- `body_measurements` — time-series body measurements
- `gym_schedule` + `gym_exceptions` — weekly open/closed schedule with date overrides

**Quasar config notes:**
- Language pack: `pt-BR`
- Active plugins: `Notify`, `Loading`, `Dialog`
- Icons: `material-icons` + Roboto font
- Router mode: `history`
- Dev server runs over HTTPS

**Layouts** use a responsive pattern: sidebar drawer on desktop (`show-if-above`, breakpoint 900px), bottom tab bar on mobile.
