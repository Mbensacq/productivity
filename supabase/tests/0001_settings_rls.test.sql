-- pgTAP RLS test for `settings`: a user can only read/write their own row.
-- Run with `supabase test db` (requires the local Docker stack).

begin;

select plan(8);

-- Two users in auth.users.
insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');

set local role authenticated;

-- ── Act as Alice ─────────────────────────────────────────────────────────────
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$ insert into public.settings (user_id, theme) values (auth.uid(), 'dark') $$,
  'Alice can insert her own settings'
);

select is(
  (select count(*)::int from public.settings),
  1,
  'Alice sees exactly her own row'
);

select throws_ok(
  $$ insert into public.settings (user_id) values ('22222222-2222-2222-2222-222222222222') $$,
  '42501',
  null,
  'Alice cannot insert a row owned by Bob (RLS WITH CHECK)'
);

-- ── Act as Bob ───────────────────────────────────────────────────────────────
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.settings),
  0,
  'Bob cannot see Alice''s row'
);

select lives_ok(
  $$ insert into public.settings (user_id) values (auth.uid()) $$,
  'Bob can insert his own settings'
);

select is(
  (select count(*)::int from public.settings),
  1,
  'Bob sees exactly his own row'
);

-- Bob's update of Alice's (invisible) row touches nothing and raises no error.
select lives_ok(
  $$ update public.settings set theme = 'light'
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'Bob updating Alice''s row affects no visible rows'
);

-- ── Back to Alice: her row must be untouched ─────────────────────────────────
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select theme from public.settings where user_id = auth.uid()),
  'dark',
  'Alice''s row is unchanged by Bob''s update'
);

select * from finish();

rollback;
