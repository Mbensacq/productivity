-- pgTAP RLS tests for goals, tasks, events, habits and habit_logs.
-- Run with `supabase test db`.

begin;

select plan(10);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');

set local role authenticated;

-- ── Alice ────────────────────────────────────────────────────────────────────
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$ insert into public.goals (title, horizon) values ('Ship app', 'quarter') $$,
  'Alice can insert a goal'
);

select lives_ok(
  $$ insert into public.tasks (title, status) values ('Write tests', 'todo') $$,
  'Alice can insert a task'
);

select is((select count(*)::int from public.tasks), 1, 'Alice sees her own task');

select lives_ok(
  $$ insert into public.events (title, starts_at, ends_at)
     values ('Focus block', now(), now() + interval '1 hour') $$,
  'Alice can insert an event'
);

select lives_ok(
  $$ insert into public.habits (name) values ('Read') $$,
  'Alice can insert a habit'
);

select lives_ok(
  $$ insert into public.habit_logs (habit_id, date)
     values ((select id from public.habits where user_id = auth.uid() limit 1), current_date) $$,
  'Alice can log a habit'
);

select throws_ok(
  $$ insert into public.tasks (user_id, title)
     values ('22222222-2222-2222-2222-222222222222', 'sneaky') $$,
  '42501',
  null,
  'Alice cannot insert a task owned by Bob'
);

-- ── Bob ──────────────────────────────────────────────────────────────────────
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is((select count(*)::int from public.tasks), 0, 'Bob cannot see Alice''s tasks');
select is((select count(*)::int from public.goals), 0, 'Bob cannot see Alice''s goals');
select is((select count(*)::int from public.events), 0, 'Bob cannot see Alice''s events');

select * from finish();

rollback;
