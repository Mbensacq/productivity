# ROADMAP

Execution plan for the "Notion × Obsidian" productivity app. Phases are sequential (0 → 1 → 2 → 3). Within a phase: data/RLS before UI, pure logic before integration. Commit after each atomic task. A phase is **Done** per §B-15 (features implemented, business logic + critical paths tested, lint/typecheck/tests green in CI, RLS tested for new tables, Pages build/deploy works, docs updated, no regressions).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (needs human/external resource)

---

## Phase 0 — Foundations (deployable skeleton + Google auth)

### 0.1 Repo & tooling
- [x] Repository, tooling and `ROADMAP.md` planning
- [x] `.gitignore`, `.env.example`, `.npmrc`
- [x] `package.json` with scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`
- [x] Vite + React 18 + TS strict config (`vite.config.ts`, `tsconfig*.json`, `base` via `VITE_BASE_PATH`)
- [x] ESLint (flat config) + Prettier wired; `tsc --noEmit` clean
- [x] Vitest + RTL + jsdom test harness; passing tests (MSW added in Phase 1 when network is mocked)
- [x] `git init`, initial commit (conventional commits)

### 0.2 App shell
- [x] Zod-validated env loader (`lib/env.ts`) + test
- [x] Supabase client (`lib/supabase.ts`, PKCE flow, persisted session, lazy)
- [x] TanStack Query client + IndexedDB persistence (`lib/queryClient.ts`)
- [x] Zustand UI store (theme, sidebar) + test
- [x] Routing with `HashRouter` (data router); route layout; lazy-loaded feature route
- [x] Light/dark theme (CSS tokens, AA contrast), toggle persisted
- [x] App layout (sidebar + topbar + content), keyboard-accessible
- [x] Global error boundary + centralized error logger + global handlers
- [x] i18n label structure (fr default) via a typed `t()` dictionary

### 0.3 Auth (Google via Supabase)
- [x] Session provider + auth state hook (`useSession`)
- [x] Auth guard (protected routes redirect to login) + test
- [x] Login page: `signInWithOAuth({ provider:'google', scopes…, access_type:offline, prompt:consent, redirectTo })` + test
- [x] OAuth return handled via `detectSessionInUrl` (PKCE auto-exchange); session captured
- [x] Logout; persisted session across reloads
- [x] Sync status indicator scaffold (online/offline)
- [!] Live Google login round-trip — needs Supabase + Google credentials (SETUP.md)

### 0.4 Backend skeleton (Supabase)
- [x] `supabase/` project structure (`config.toml`, `migrations/`, `seed.sql`, `tests/`)
- [x] Migration: `updated_at` trigger fn, `settings` table + full RLS
- [x] RLS test (pgTAP) proving cross-user isolation — runs in CI (`db-tests.yml`, needs Docker)

### 0.5 CI/CD & deploy
- [x] `.github/workflows/ci.yml` (install, lint, typecheck, tests, build)
- [x] `.github/workflows/deploy.yml` (build with injected `VITE_*`, `actions/deploy-pages`)
- [x] `.github/workflows/supabase.yml` (migrations + functions deploy, gated)
- [x] `.github/workflows/db-tests.yml` (local stack + pgTAP RLS)
- [x] `SETUP.md` (Supabase + Google Cloud + GitHub Pages step-by-step) — **human-intervention checklist**
- [x] `README.md` (overview, architecture, dev, build, known limits)
- [x] Push to `Mbensacq/productivity`; **CI green in CI**, **RLS pgTAP green in CI**, Supabase workflow green
- [!] Enable GitHub Pages (Settings → Pages → Source: GitHub Actions) — Deploy fails at `configure-pages` until then (build itself passes)
- [!] Add GitHub secrets (`VITE_*`, `SUPABASE_*`) so the deployed app is configured + migrations push
- [!] Verify live: deployed app under subpath, deep hash-route refresh, Google login round-trip

---

## Phase 1 — Notion × Obsidian core

### 1.1 Data & RLS
- [ ] Migration: `notes` (title, body, frontmatter jsonb, tags[], is_daily, daily_date, search tsvector + GIN), RLS + tests
- [ ] Migration: `note_links` (source, target nullable, target_title, indexes both ways), RLS + tests

### 1.2 Pure domain logic (no React/IO, unit-tested) — ✅ done
- [x] Wikilink parser `[[ ]]` (+ aliases `[[a|b]]`, headings `[[a#h]]`, embeds, autocomplete query)
- [x] Frontmatter parse/serialize (js-yaml + Zod), body/frontmatter split
- [x] Link resolution + backlinks + unresolved + orphans
- [x] Graph builder (nodes/edges, dedupe, local subgraph by depth)
- [x] Tag extraction (`#tag`)
- [x] Local search index (minisearch) builder/query

### 1.3 DB layer — ✅ done
- [x] `db/noteMapping` (Zod-validated row<->model), `db/notesRepo`, `db/noteLinksRepo`
- [x] Realtime subscription → TanStack Query cache invalidation
- [x] Server full-text search query (tsvector, `textSearch` websearch)

### 1.4 UI
- [x] CodeMirror 6 Markdown editor (live), `[[` autocomplete, on-the-fly note creation
- [x] Markdown render (react-markdown + remark-gfm + custom wikilink remark plugin)
- [x] Backlinks panel
- [x] Interactive graph (global) — local subgraph domain ready; depth/virtualization later
- [x] Search (client via command palette; server FTS repo ready)
- [x] Command palette (Cmd/Ctrl-K)
- [x] Daily notes via template
- [x] Notes CRUD wired to Supabase + Realtime + optimistic updates
- [ ] PWA installable (vite-plugin-pwa) + offline read

### 1.5 Tests / DoD
- [x] Unit: wikilink/frontmatter/backlinks/graph/search/tags/metadata/daily
- [x] Component: markdown preview (wikilinks), command palette
- [ ] e2e: login → 2 linked notes → graph + backlink (Playwright, CI)
- [~] Docs + ROADMAP updated; CI green (PWA + e2e remaining)

---

## Phase 2 — Productivity & tasks

### 2.1 Data & RLS — ✅ done
- [x] Migrations: `tasks`, `events`, `habits`, `habit_logs`, `goals` (+ RLS + pgTAP, green in CI)

### 2.2 Pure logic — ✅ done
- [x] Recurrence engine (jsonb rule → next occurrences)
- [x] Anti-procrastination rules: forced decomposition (>25min needs subtask), implementation-intention gate, defer friction, 2-minute filter
- [x] Estimate-vs-actual + Pomodoro time accounting

### 2.3 UI
- [x] Task data layer (mapping + repo + hooks, MSW-tested)
- [x] GTD inbox + quick capture
- [x] Anti-procrastination UX: start guard (decomposition + intention), 2-minute and defer hints
- [ ] Database views: table / kanban / calendar with filter/sort on properties
- [ ] Subtasks, priorities, dates, recurrence editing UI
- [ ] Pomodoro timer → logs `spent_min`; start mode (5-min)
- [ ] Time-blocking (drag task → calendar `event`)
- [ ] Habit tracker (contributions grid, streaks)
- [ ] Hierarchical goals ("why" linked to tasks)
- [ ] Procrastination journal

### 2.4 Tests / DoD
- [x] Unit: recurrence, anti-procrastination (with counter-examples), pomodoro
- [ ] Component: views, anti-procrastination guards
- [ ] e2e: create → decompose → schedule a task
- [~] Docs + CI green (UI in progress)

---

## Phase 3 — Google + memory + steering

### 3.1 Google connection (B-6)
- [ ] Migration: `google_credentials` (encrypted refresh token via Vault/pgsodium), `sync_cursors` (+ RLS + tests)
- [ ] Edge Function `google-token-refresh` (stores/refreshes via client_secret; handles `invalid_grant`)
- [ ] OAuth connect flow persists `provider_refresh_token` server-side; reconnect on broken
- [ ] Edge Function tests (refresh, invalid_grant)

### 3.2 Calendar & Tasks sync (B-7)
- [ ] Edge Function `google-calendar-sync` (incremental `syncToken`, `410` resync, etag, bidirectional)
- [ ] Edge Function `google-tasks-sync` (dedicated list mapping, bidirectional)
- [ ] Conflict resolution (LWW by timestamp/etag), `conflict` status surfaced
- [ ] `.ics` import/export (ical.js), client-side bridge
- [ ] Tests (MSW for Google; incremental sync; conflict)

### 3.3 Memory & dashboard
- [ ] SRS cards (`cards` table + RLS + tests); SM-2 sessions; flashcards from notes
- [ ] Guided weekly review template
- [ ] Dashboard (done/week, focus time, streaks, estimate vs actual, orphan notes)
- [ ] Note templates
- [ ] Best-effort notifications (Pomodoro, time-block end) + documented limits

### 3.4 Tests / DoD
- [ ] Unit: SM-2, Google↔model mapping, ics, offline merge
- [ ] Integration: Edge Functions, sync incremental + `410`
- [ ] e2e: simulated Google connect → push task → read back
- [ ] Final docs, "Known limits", CI green, full deploy verified

---

## Human-intervention items (see SETUP.md) — needed for full runtime, not for building
- [!] Supabase project: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`, `ACCESS_TOKEN`, `PROJECT_REF`
- [!] Google Cloud OAuth client + Calendar/Tasks APIs + consent screen + redirect URIs + publish to Production
- [!] GitHub Actions secrets
- [!] Enable GitHub Pages (source: GitHub Actions)
