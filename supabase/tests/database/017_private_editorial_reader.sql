begin;

select plan(6);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.editorial_reader_roles'::regclass),
  'editorial_reader_roles has RLS enabled'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'editorial_reader_roles'),
  0,
  'editorial reader allow-list has no direct browser policies'
);

select ok(
  not has_table_privilege('anon', 'public.editorial_reader_roles', 'select'),
  'anon cannot read editorial reader allow-list'
);

select ok(
  not has_table_privilege('authenticated', 'public.editorial_reader_roles', 'select'),
  'authenticated cannot read editorial reader allow-list'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'editorial_contents'
      and cmd = 'SELECT'
      and qual like '%published%'
  ),
  'public editorial policy remains constrained to published content'
);

select ok(
  not exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'editorial_contents'
      and cmd = 'SELECT'
      and qual like '%draft%'
  ),
  'no direct browser policy exposes editorial drafts'
);

select * from finish();
rollback;
