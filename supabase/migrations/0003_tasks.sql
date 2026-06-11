-- 0003_tasks.sql
-- Productivity domain: goals, tasks (with subtasks, recurrence, anti-procrastination
-- fields), calendar events, habits and habit logs. All RLS-protected per user.

-- ── goals ────────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  parent_id uuid references public.goals (id) on delete set null,
  horizon text not null default 'week' check (horizon in ('life', 'year', 'quarter', 'week')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists goals_parent_idx on public.goals (parent_id);

-- ── tasks ────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  note_id uuid references public.notes (id) on delete set null,
  status text not null default 'inbox'
    check (status in ('inbox', 'todo', 'doing', 'done', 'someday')),
  priority smallint check (priority between 1 and 4),
  estimate_min integer check (estimate_min >= 0),
  spent_min integer not null default 0 check (spent_min >= 0),
  due date,
  scheduled_event_id uuid,
  implementation_intention text,
  defer_count integer not null default 0 check (defer_count >= 0),
  parent_task_id uuid references public.tasks (id) on delete cascade,
  recurrence jsonb,
  goal_id uuid references public.goals (id) on delete set null,
  google_task_id text,
  google_tasklist_id text,
  sync_state text not null default 'local'
    check (sync_state in ('local', 'synced', 'pending', 'conflict')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_status_idx on public.tasks (user_id, status);
create index if not exists tasks_parent_idx on public.tasks (parent_task_id);
create index if not exists tasks_goal_idx on public.tasks (goal_id);
create index if not exists tasks_note_idx on public.tasks (note_id);

-- ── events ───────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  task_id uuid references public.tasks (id) on delete set null,
  source text not null default 'local' check (source in ('local', 'google')),
  google_event_id text,
  google_calendar_id text,
  sync_state text not null default 'local'
    check (sync_state in ('local', 'synced', 'pending', 'conflict')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index if not exists events_user_id_idx on public.events (user_id);
create index if not exists events_range_idx on public.events (user_id, starts_at, ends_at);
create index if not exists events_task_idx on public.events (task_id);

-- Close the tasks <-> events cycle once both tables exist.
alter table public.tasks
  add constraint tasks_scheduled_event_fk
  foreign key (scheduled_event_id) references public.events (id) on delete set null;

-- ── habits ───────────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '',
  schedule jsonb not null default '{}'::jsonb,
  color text not null default '#1f5fd6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists habits_user_id_idx on public.habits (user_id);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
create index if not exists habit_logs_user_id_idx on public.habit_logs (user_id);
create index if not exists habit_logs_habit_date_idx on public.habit_logs (habit_id, date);

-- ── updated_at triggers ──────────────────────────────────────────────────────
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.set_updated_at();

-- ── RLS + grants + policies ──────────────────────────────────────────────────
do $$
declare
  tbl text;
begin
  foreach tbl in array array['goals', 'tasks', 'events', 'habits', 'habit_logs']
  loop
    execute format('alter table public.%I enable row level security;', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', tbl);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id);',
      tbl || '_select_own', tbl);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id);',
      tbl || '_insert_own', tbl);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      tbl || '_update_own', tbl);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id);',
      tbl || '_delete_own', tbl);
  end loop;
end;
$$;
