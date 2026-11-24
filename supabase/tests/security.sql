-- ShrimpHero security check.
-- Paste into Supabase > SQL Editor and press Run, after the six migration files.
-- It pretends to be visitors and tries to break every rule. Every attempt must fail.
-- It cleans up after itself. Result: "all checks passed", or an error that starts with FAILED.

do $check$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-00000000000b';
  c uuid := '00000000-0000-4000-8000-00000000000c';
  test_store text := 'test/shrimphero-security-check';
  today date := (now() at time zone 'Europe/Paris')::date;
  total_before bigint;
  total_now bigint;
  n bigint;
  i integer;
  b_entry bigint;
  a_entry bigint;
  bad text;
begin
  ---------------------------------------------------------------- setup (as admin)
  delete from public.profiles where user_id in (a, b, c) or nickname like 'Testdummy %';
  delete from public.reports where reporter_id in (a, b, c);
  delete from public.entries where store_id = test_store;
  delete from public.stores where id = test_store;
  insert into public.stores (id, name, street, city, postcode, country, lat, lng)
  values (test_store, 'Lidl', 'Rue du Test 1', 'Testville', '00000', 'FR', 48.8566, 2.3522);
  select total_stickers into total_before from public.public_totals();

  ---------------------------------------------------------------- RLS and grants exist
  select count(*) into n from pg_class c2 join pg_namespace ns on ns.oid = c2.relnamespace
   where ns.nspname = 'public' and c2.relkind = 'r' and not c2.relrowsecurity;
  if n > 0 then raise exception 'FAILED: a public table has row level security off'; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%');
  if n > 0 then raise exception 'FAILED: a security definer function has no fixed search_path'; end if;

  if has_table_privilege('anon', 'public.profiles', 'select')
     or has_table_privilege('anon', 'public.entries', 'select')
     or has_table_privilege('anon', 'public.reports', 'select')
     or has_table_privilege('authenticated', 'public.reports', 'select')
     or has_table_privilege('authenticated', 'public.settings', 'update')
     or has_table_privilege('authenticated', 'public.nickname_blocklist', 'select')
     or has_table_privilege('authenticated', 'public.entries', 'insert')
     or has_table_privilege('authenticated', 'public.entries', 'update')
     or has_table_privilege('authenticated', 'public.profiles', 'insert')
     or has_table_privilege('authenticated', 'public.profiles', 'update') then
    raise exception 'FAILED: visitors have table rights they should not have';
  end if;

  if pg_get_function_result('public.leaderboard()'::regprocedure) <> 'TABLE(rank bigint, nickname text, total bigint)' then
    raise exception 'FAILED: leaderboard returns more than rank, nickname and total';
  end if;
  if pg_get_function_result('public.store_map()'::regprocedure) ilike '%nick%'
     or pg_get_function_result('public.store_map()'::regprocedure) ilike '%date%' then
    raise exception 'FAILED: store_map returns nicknames or dates';
  end if;

  ---------------------------------------------------------------- not signed in (anon)
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);

  foreach bad in array array['public.profiles', 'public.entries', 'public.reports', 'public.settings',
                             'public.stores', 'public.stores_import', 'public.nickname_blocklist'] loop
    begin
      execute 'select count(*) from ' || bad into n;
      if n > 0 then raise exception 'FAILED: anon can read %', bad; end if;
    exception when insufficient_privilege then null;
    end;
  end loop;

  begin
    perform public.set_nickname('Anon Test');
    raise exception 'FAILED: anon could set a nickname';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.log_stickers(test_store, 5, today);
    raise exception 'FAILED: anon could log stickers';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.delete_my_data();
    raise exception 'FAILED: anon could call delete_my_data';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;

  -- Public functions work for anon.
  perform * from public.public_totals();
  perform * from public.leaderboard();
  perform * from public.store_map();
  perform * from public.impact_settings();
  select count(*) into n from public.search_stores('testville');
  if n < 1 then raise exception 'FAILED: store search does not find the test store'; end if;
  select count(*) into n from public.nearby_stores(48.86, 2.35);
  if n < 1 then raise exception 'FAILED: nearby search does not find the test store'; end if;

  ---------------------------------------------------------------- person A
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  foreach bad in array array['ab', 'abcdefghijklmnopqrstu', 'Lidl Fan', 'L1DL fan', 'adm1n', 'Admin',
                             'www shrimp', 'shrimp com', 'f u c k', 'fuckface', 'kurwa mac', 'Hurensohn',
                             'a.b.c', '<script>', '-dash start', 'two  spaces', 'Hans 1488', 'emoji 🦐'] loop
    begin
      perform public.set_nickname(bad);
      raise exception 'FAILED: nickname "%" was accepted', bad;
    exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
    end;
  end loop;

  -- Normal names that contain a blocked word inside must still work.
  perform public.set_nickname('Badminton Monique');
  perform public.set_nickname('Crevette Test A');

  begin
    perform public.log_stickers(test_store, 0, today);
    raise exception 'FAILED: 0 stickers accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.log_stickers(test_store, 51, today);
    raise exception 'FAILED: 51 stickers accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.log_stickers(test_store, 5, today + 1);
    raise exception 'FAILED: a future date was accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.log_stickers(test_store, 5, today - 8);
    raise exception 'FAILED: a date 8 days back was accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    perform public.log_stickers('test/no-such-store', 5, today);
    raise exception 'FAILED: an unknown store was accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;

  perform public.log_stickers(test_store, 5, today);
  perform public.log_stickers(test_store, 3, today - 7);

  -- Direct table writes are refused.
  begin
    insert into public.entries (user_id, store_id, stickers, entry_date) values (a, test_store, 5, today);
    raise exception 'FAILED: direct insert into entries worked';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    update public.entries set stickers = 50 where user_id = a;
    raise exception 'FAILED: an entry could be changed';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    update public.profiles set blocked = false where user_id = a;
    raise exception 'FAILED: a profile could be changed directly';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;

  ---------------------------------------------------------------- person B
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  foreach bad in array array['crevette test a', 'Crévette Test A', 'CREVETTE TEST A'] loop
    begin
      perform public.set_nickname(bad);
      raise exception 'FAILED: duplicate nickname "%" was accepted', bad;
    exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
    end;
  end loop;
  perform public.set_nickname('Krewetka Test B');

  -- B sees no rows of A.
  select count(*) into n from public.entries where user_id <> b;
  if n > 0 then raise exception 'FAILED: B can read A''s entries'; end if;
  select count(*) into n from public.profiles where user_id <> b;
  if n > 0 then raise exception 'FAILED: B can read other profiles'; end if;
  select count(*) into n from public.my_entries();
  if n <> 0 then raise exception 'FAILED: my_entries shows someone else''s entries'; end if;

  -- B can't delete A's entries.
  delete from public.entries where user_id = a;
  perform public.delete_my_entry(id) from public.entries where user_id = a;

  -- 200 stickers a day, then stop.
  for i in 1..4 loop perform public.log_stickers(test_store, 50, today); end loop;
  begin
    perform public.log_stickers(test_store, 1, today);
    raise exception 'FAILED: more than 200 stickers in a day were accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;

  select rank, total into n, total_now from public.my_rank();
  if total_now <> 200 then raise exception 'FAILED: my_rank shows % instead of 200', total_now; end if;

  ---------------------------------------------------------------- person A again: 10 entries a day
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  for i in 1..8 loop perform public.log_stickers(test_store, 1, today); end loop;
  begin
    perform public.log_stickers(test_store, 1, today);
    raise exception 'FAILED: an 11th entry in one day was accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;

  ---------------------------------------------------------------- admin checks
  execute 'reset role';
  select count(*) into n from public.entries where user_id = a;
  if n <> 10 then raise exception 'FAILED: A should have 10 entries, has % (B deleted some?)', n; end if;

  select total_stickers into total_now from public.public_totals();
  if total_now - total_before <> 5 + 3 + 8 + 200 then
    raise exception 'FAILED: total grew by % instead of 216', total_now - total_before;
  end if;

  -- Hidden entries stop counting.
  select id into b_entry from public.entries where user_id = b limit 1;
  update public.entries set hidden = true where id = b_entry;
  select total into n from public.leaderboard() where nickname = 'Krewetka Test B';
  if n <> 150 then raise exception 'FAILED: hidden entry still counts (B shows %)', n; end if;

  -- Blocked people stop counting and can't log.
  update public.profiles set blocked = true where user_id = b;
  if exists (select 1 from public.leaderboard() where nickname = 'Krewetka Test B') then
    raise exception 'FAILED: blocked person still on the leaderboard';
  end if;
  select total_stickers into total_now from public.public_totals();
  if total_now - total_before <> 16 then raise exception 'FAILED: blocked person still counts in the total'; end if;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin
    perform public.log_stickers(test_store, 1, today - 1);
    raise exception 'FAILED: a blocked person could log stickers';
  exception when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
    if sqlerrm <> 'blocked' then raise exception 'FAILED: blocked person got "%" instead of "blocked"', sqlerrm; end if;
  end;

  ---------------------------------------------------------------- reports
  execute 'reset role';
  for i in 1..20 loop
    insert into public.profiles (user_id, nickname) values (gen_random_uuid(), 'Testdummy ' || lpad(i::text, 2, '0'));
  end loop;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform public.report_nickname('crevette test a');
  perform public.report_nickname('Crevette Test A');
  for i in 1..19 loop perform public.report_nickname('Testdummy ' || lpad(i::text, 2, '0')); end loop;
  begin
    perform public.report_nickname('Testdummy 20');
    raise exception 'FAILED: more than 20 reports in a day were accepted';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  begin
    execute 'select count(*) from public.reports' into n;
    raise exception 'FAILED: a visitor can read reports';
  exception when others then if sqlerrm like 'FAILED:%' then raise; end if;
  end;
  execute 'reset role';
  select count(*) into n from public.reports where reporter_id = c and reported_id = a;
  if n <> 1 then raise exception 'FAILED: reporting the same nickname twice made % rows', n; end if;

  ---------------------------------------------------------------- delete my data
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.delete_my_data();
  execute 'reset role';
  if exists (select 1 from public.profiles where user_id = a)
     or exists (select 1 from public.entries where user_id = a)
     or exists (select 1 from public.reports where reported_id = a) then
    raise exception 'FAILED: delete_my_data left data behind';
  end if;

  ---------------------------------------------------------------- clean up
  delete from public.reports where reporter_id in (a, b, c);
  delete from public.profiles where user_id in (a, b, c) or nickname like 'Testdummy %';
  delete from public.entries where store_id = test_store;
  delete from public.stores where id = test_store;
end
$check$;

select 'all checks passed' as result;
