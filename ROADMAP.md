# ROADMAP

Execution plan for the "Notion × Obsidian" productivity app. Phases are sequential (0 → 1 → 2 → 3). Within a phase: data/RLS before UI, pure logic before integration. Commit after each atomic task. A phase is **Done** per §B-15 (features implemented, business logic + critical paths tested, lint/typecheck/tests green in CI, RLS tested for new tables, Pages build/deploy works, docs updated, no regressions).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (needs human/external resource)

---

## Phase 0 — Foundations (deployable skeleton + Google auth)

### 0.1 Repo & tooling
- [x] Map environment, define WSL execution path, record in `tasks/lessons.md`
- [x] `tasks/lessons.md`, `tasks/todo.md`, `ROADMAP.md`
- [x] `.gitignore`, `.env.example`, `.npmrc`
- [x] `package.json` with scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`
- [x] Vite + React 18 + TS strict config (`vite.config.ts`, `tsconfig*.json`, `base` via `VITE_BASE_PATH`)
- [x] ESLint (flat config) + Prettier wired; `tsc --noEmit` clean
- [x] Vitest + RTL + jsdom test harness; passing tests (MSW added in Phase 1 when network is mocked)
- [x] `git init`, initial commit (human identity, conventional commits)

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
- [!] Push to GitHub, enable Pages, verify deployed (assets under subpath, deep-route refresh, Google login) — needs human secrets + repo

---

## Phase 1 — Notion × Obsidian core

### 1.1 Data & RLS
- [ ] Migration: `notes` (title, body, frontmatter jsonb, tags[], is_daily, daily_date, search tsvector + GIN), RLS + tests
- [ ] Migration: `note_links` (source, target nullable, target_title, indexes both ways), RLS + tests

### 1.2 Pure domain logic (no React/IO, unit-tested)
- [ ] Wikilink parser `[[ ]]` (+ aliases `[[a|b]]`, headings `[[a#h]]`)
- [ ] Frontmatter parse/serialize (js-yaml + Zod), body/frontmatter split
- [ ] Link resolution + backlinks computation
- [ ] Graph builder (nodes/edges, local subgraph by depth)
- [ ] Tag extraction (`#tag`)
- [ ] Local search index (minisearch) builder/query

### 1.3 DB layer
- [ ] `db/notesRepo`, `db/noteLinksRepo` with Zod-validated IO
- [ ] Realtime subscription → TanStack Query cache updates
- [ ] Server full-text search query (tsvector)

### 1.4 UI
- [ ] CodeMirror 6 Markdown editor (live), `[[` autocomplete, on-the-fly note creation
- [ ] Markdown render (react-markdown + remark-gfm + remark-frontmatter + wikilink/tag plugins)
- [ ] Backlinks panel
- [ ] Interactive graph (global + local) with depth limit / virtualization
- [ ] Full-text search UI
- [ ] Command palette (Cmd/Ctrl-K)
- [ ] Daily notes via template
- [ ] Notes CRUD wired to Supabase + Realtime + optimistic updates
- [ ] PWA installable (vite-plugin-pwa) + offline read

### 1.5 Tests / DoD
- [ ] Unit: wikilink/frontmatter/backlinks/graph/search
- [ ] Component: editor, palette
- [ ] e2e: login → 2 linked notes → graph + backlink
- [ ] Docs + ROADMAP updated; CI green

---

## Phase 2 — Productivity & tasks

### 2.1 Data & RLS
- [ ] Migrations: `tasks`, `events`, `habits`, `habit_logs`, `goals` (+ RLS + tests)

### 2.2 Pure logic
- [ ] Recurrence engine (jsonb rule → next occurrences)
- [ ] Anti-procrastination rules: forced decomposition (>25min needs subtask), implementation-intention gate, defer friction, 2-minute filter
- [ ] Estimate-vs-actual + Pomodoro time accounting

### 2.3 UI
- [ ] GTD inbox + quick capture
- [ ] Database views: table / kanban / calendar with filter/sort on frontmatter & properties
- [ ] Tasks (subtasks, priorities, dates, recurrence)
- [ ] Anti-procrastination UX (decomposition, intention, defer badge, start mode + 5-min Pomodoro, procrastination journal)
- [ ] Pomodoro timer → logs `spent_min`
- [ ] Time-blocking (drag task → calendar `event`)
- [ ] Habit tracker (contributions grid, streaks)
- [ ] Hierarchical goals ("why" linked to tasks)

### 2.4 Tests / DoD
- [ ] Unit: recurrence, anti-procrastination (with counter-examples), SM-2 prep
- [ ] Component: table/kanban/calendar, anti-procrastination guards
- [ ] e2e: create → decompose → schedule a task
- [ ] Docs + CI green

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
