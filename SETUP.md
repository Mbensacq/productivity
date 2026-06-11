# SETUP — external services & secrets

This app needs three external setups that **you** must perform (they require
accounts/consoles the build cannot access). Everything else is automated. Do
them in this order. This repo is **`Mbensacq/productivity`**. Remaining
placeholder: `<PROJECT_REF>` = your Supabase project ref (known after step 1).

The deployed app URL (GitHub Pages **project** site) is:

```
https://mbensacq.github.io/productivity/
```

> The `*.github.io` host is lower-cased by GitHub — use `mbensacq.github.io`
> exactly (it matters for Google's authorized origins/redirects).

---

## 1. Supabase project

1. Create a project at https://supabase.com → **New project**. Pick a region
   close to you and set a strong database password (store it in a password
   manager).
2. **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL` (e.g. `https://<PROJECT_REF>.supabase.co`)
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (**secret** — CI / Edge
     Functions only, never in the frontend)
3. **Project Settings → General** → copy the **Reference ID** → `SUPABASE_PROJECT_REF`.
4. Create a CLI access token at https://supabase.com/dashboard/account/tokens →
   `SUPABASE_ACCESS_TOKEN` (**secret** — CI only).

**Verify:** `VITE_SUPABASE_URL` opens a JSON page; the project dashboard loads.

### Enable Google as an auth provider (in Supabase)

1. **Authentication → Providers → Google** → enable.
2. Paste the Google **Client ID** and **Client Secret** from step 2 below.
3. Note the **Callback URL** shown there — it is:
   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`. You'll register it in
   Google in the next step.
4. **Authentication → URL Configuration** → add `https://mbensacq.github.io/productivity/`
   to **Redirect URLs** (and `http://localhost:5173/` for local dev).

---

## 2. Google Cloud — OAuth client + APIs

1. https://console.cloud.google.com → create/select a project.
2. **APIs & Services → Enable APIs**: enable **Google Calendar API** and
   **Google Tasks API**.
3. **OAuth consent screen**:
   - User type **External**.
   - Add scopes: `openid`, `email`, `profile`,
     `https://www.googleapis.com/auth/calendar`,
     `https://www.googleapis.com/auth/tasks`.
   - Add your Google account under **Test users**.
   - **Publish app** → **In production**. ⚠️ In *Testing* status, Google refresh
     tokens for sensitive scopes **expire after 7 days**; publishing avoids that.
     For personal use you can accept the "unverified app" screen — full
     verification is only needed for wide distribution.
4. **Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized JavaScript origins**: `https://mbensacq.github.io` and
     `http://localhost:5173`.
   - **Authorized redirect URIs**: add **both**
     - `https://<PROJECT_REF>.supabase.co/auth/v1/callback` (Supabase callback)
     - `https://mbensacq.github.io/productivity/` (this app — exact subpath incl. trailing slash)
     - `http://localhost:5173/` (local dev)
5. Copy:
   - **Client ID** → `VITE_GOOGLE_CLIENT_ID` (public) **and** paste into Supabase
     Google provider.
   - **Client secret** → `GOOGLE_CLIENT_SECRET` (**secret**). Paste into Supabase
     Google provider, and (Phase 3) set it as an Edge Function secret:
     `supabase secrets set GOOGLE_CLIENT_SECRET=...`.

**Verify:** the OAuth client lists exactly the redirect URIs above; both APIs
show **Enabled**.

---

## 3. GitHub — Actions secrets & Pages

### Secrets (Settings → Secrets and variables → Actions → New repository secret)

| Name                        | Value (from above)                  | Used by         |
| --------------------------- | ----------------------------------- | --------------- |
| `VITE_SUPABASE_URL`         | Supabase Project URL                | deploy (build)  |
| `VITE_SUPABASE_ANON_KEY`    | Supabase anon key                   | deploy (build)  |
| `VITE_GOOGLE_CLIENT_ID`     | Google OAuth client ID              | deploy (build)  |
| `SUPABASE_ACCESS_TOKEN`     | Supabase CLI token                  | supabase deploy |
| `SUPABASE_PROJECT_REF`      | Supabase project ref                | supabase deploy |
| `SUPABASE_DB_PASSWORD`      | Database password (from step 1)     | supabase deploy |

> `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_CLIENT_SECRET` are **not** GitHub
> secrets in Phase 0/1/2. They become Supabase Edge Function secrets in Phase 3.

### Enable Pages

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. The `deploy` workflow builds and publishes automatically.

**Verify after deploy:**
- `https://mbensacq.github.io/productivity/` loads (assets resolve under the subpath).
- A deep hash route refresh (e.g. `…/#/login`) does **not** 404.
- Clicking **Se connecter avec Google** redirects to Google and returns to the
  app URL signed in.

---

## Local development

```bash
cp .env.example .env.local      # fill VITE_SUPABASE_URL / ANON_KEY / GOOGLE_CLIENT_ID
npm install
npm run dev                     # http://localhost:5173
```

Without Supabase values the app boots and shows a "Configuration requise"
screen — by design, so the UI never crashes on missing config.

## Local database & RLS tests (optional, needs Docker)

```bash
supabase start                  # local Postgres/Auth stack (Docker)
supabase db reset               # apply migrations + seed
supabase test db                # run pgTAP RLS tests in supabase/tests/
```
