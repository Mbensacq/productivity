# Productivity

A personal knowledge-management web application for Markdown notes connected by
bidirectional links, with an interactive graph, full-text search, and
offline-first synchronization.

[![CI](https://github.com/Mbensacq/productivity/actions/workflows/ci.yml/badge.svg)](https://github.com/Mbensacq/productivity/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
<!-- TODO: add a license badge once a LICENSE is chosen -->

## Overview

A single-page web app for capturing and connecting knowledge. Notes are written
in Markdown with YAML frontmatter and linked with `[[wikilink]]` syntax; the app
resolves those links into backlinks and an interactive graph of the note
network. It is built on a relational data model (PostgreSQL via Supabase) that
also defines structured records (tasks, events, habits, goals) intended to drive
database-style views — see the [Roadmap](#roadmap) for current status.

The frontend holds no server secrets: it talks to Supabase with a public
anonymous key, and data isolation between users is enforced by PostgreSQL Row
Level Security.

### Screenshots

<!-- TODO: add real screenshots under docs/ and update the paths below -->

![Note editor with live wikilink autocomplete](docs/editor.png)
![Graph view of the note network](docs/graph.png)
![Command palette (Cmd/Ctrl-K)](docs/command-palette.png)

## Features

- **Markdown editor** (CodeMirror 6) with `[[wikilink]]` autocompletion and
  on-the-fly note creation.
- **Bidirectional links**: a backlinks panel per note and an interactive,
  force-directed graph of the whole note network.
- **Full-text search**: server-side PostgreSQL `tsvector` queries plus a
  client-side index, surfaced through a `Cmd`/`Ctrl-K` command palette.
- **Daily notes, tags, and YAML frontmatter** parsing/serialization.
- **Offline-first sync**: the query cache is persisted to IndexedDB, writes are
  optimistic, and changes propagate across devices over Supabase Realtime.
- **Google sign-in** (Supabase Auth, PKCE flow) with light/dark theming and
  keyboard-accessible navigation.

## Tech stack

| Area              | Technology                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| Language          | TypeScript (strict)                                                        |
| UI                | React 18                                                                   |
| Build tooling     | Vite 5                                                                      |
| Routing           | React Router (`HashRouter`)                                                |
| Server state/cache| TanStack Query + IndexedDB persistence (`idb-keyval`)                       |
| Local UI state    | Zustand                                                                     |
| Backend           | Supabase — PostgreSQL, Auth, Realtime, Row Level Security                   |
| Editor            | CodeMirror 6 (`@uiw/react-codemirror`, `@codemirror/lang-markdown`)         |
| Markdown render   | `react-markdown`, `remark-gfm`, `remark-frontmatter` (+ custom wikilink plugin) |
| Graph             | `react-force-graph-2d`                                                      |
| Search            | PostgreSQL full-text + MiniSearch                                          |
| Validation        | Zod                                                                        |
| Frontmatter/dates | `js-yaml`, `date-fns`                                                       |
| Testing           | Vitest, React Testing Library, MSW; pgTAP for SQL/RLS                       |
| Tooling           | ESLint (flat config), Prettier                                             |
| CI/CD             | GitHub Actions, GitHub Pages                                               |

## Getting started

### Prerequisites

- Node.js `>= 20` and npm
- A [Supabase](https://supabase.com) project for authentication and data
- (Optional) Docker + the Supabase CLI to run the local database and RLS tests

### Installation

```bash
git clone https://github.com/Mbensacq/productivity.git
cd productivity
npm install
```

### Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable                 | Required          | Description                                            |
| ------------------------ | ----------------- | ------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | yes               | Supabase project URL                                   |
| `VITE_SUPABASE_ANON_KEY` | yes               | Supabase anonymous (public) key                        |
| `VITE_GOOGLE_CLIENT_ID`  | for Google sign-in| Google OAuth web client id (public)                    |
| `VITE_BASE_PATH`         | no                | Base path for deployment (defaults to `/`)             |
| `VITE_SENTRY_DSN`        | no                | Optional Sentry DSN (error reporting, off by default)  |

All frontend variables are public and safe to ship in the bundle. Server-side
secrets (Supabase `service_role` key, Google client secret) are never read by
the frontend. Full external setup — Supabase, Google OAuth, and GitHub Pages — is
documented in [`SETUP.md`](./SETUP.md).

> Without Supabase credentials the app still boots and renders a
> "configuration required" screen instead of failing.

## Usage

Development server (defaults to `http://localhost:5173`):

```bash
npm run dev
```

Production build and local preview:

```bash
npm run build
npm run preview
```

Quality checks:

```bash
npm run lint        # ESLint (zero warnings allowed)
npm run typecheck   # tsc --noEmit (app + tooling configs)
npm run test        # Vitest (unit + component)
```

Local database schema and Row Level Security tests (requires Docker + Supabase CLI):

```bash
supabase start      # boot local Postgres + Auth
supabase db reset   # apply migrations + seed
supabase test db    # run pgTAP RLS tests
```

## Project structure

```text
.
├── src/
│   ├── app/            # Router (HashRouter) and route definitions
│   ├── components/     # Shared UI (layout, error boundary, theme toggle, …)
│   ├── domain/         # Pure, framework-agnostic logic (wikilinks, graph, search, frontmatter, …)
│   ├── db/             # Supabase repositories + Zod row mapping
│   ├── features/       # Feature modules (auth, notes, command-palette)
│   ├── hooks/          # Reusable React hooks
│   ├── lib/            # Env validation, Supabase client, query client, i18n, logging
│   ├── store/          # Zustand stores
│   └── test/           # Test setup and helpers
├── supabase/
│   ├── migrations/     # Versioned SQL schema + RLS policies
│   ├── tests/          # pgTAP tests (per-user data isolation)
│   └── config.toml     # Local Supabase stack configuration
├── .github/workflows/  # CI, Pages deploy, Supabase migrations, DB tests
├── index.html
├── vite.config.ts
└── package.json
```

## Roadmap

The notes core and the data layer are implemented; the productivity surface is
in progress. Detailed phase tracking lives in [`ROADMAP.md`](./ROADMAP.md).

**Implemented**

- Linked Markdown notes: wikilinks, backlinks, interactive graph
- Full-text search and `Cmd`/`Ctrl-K` command palette
- Daily notes, tags, frontmatter
- Supabase CRUD with Realtime, optimistic updates, and an offline cache
- Google authentication and per-user RLS
- Relational schema for tasks, events, habits, and goals (with RLS)

**Planned**

- Structured database views (table / board / calendar) over the productivity schema
- Google Calendar and Tasks synchronization
- Spaced-repetition review of note-derived cards
- Analytics dashboard
- Installable PWA with an offline write queue
- End-to-end tests

## License

<!-- TODO: add a LICENSE file and state the license here (e.g. MIT) -->

## Author

Mathis Bensacq — [https://github.com/Mbensacq](https://github.com/Mbensacq)
