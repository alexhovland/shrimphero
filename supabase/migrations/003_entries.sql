-- ShrimpHero database, step 3 of 6: logging stickers and the limits on it.

-- Helper: shrimp helped per sticker = S x p / N, from the settings table.
create or replace function public.shrimp_per_sticker()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select value from public.settings where key = 'S')
    * (select value from public.settings where key = 'p')
    / nullif((select value from public.settings where key = 'N'), 0),
    0)
$$;

-- Runs before every new entry, whoever inserts it.
create or replace function public.check_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Europe/Paris')::date;
  day_start timestamptz := (today::timestamp at time zone 'Europe/Paris');
  entries_today integer;
  stickers_today integer;
begin
  -- One insert at a time per person, so two quick taps can't slip past the limits.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  if exists (select 1 from public.profiles where user_id = new.user_id and blocked) then
    raise exception 'blocked' using errcode = 'P0001';
  end if;
  if new.stickers is null or new.stickers < 1 or new.stickers > 50 then
    raise exception 'stickers_range' using errcode = 'P0001';
  end if;
  if new.entry_date is null or new.entry_date > today then
    raise exception 'date_future' using errcode = 'P0001';
  end if;
  if new.entry_date < today - 7 then
    raise exception 'date_too_old' using errcode = 'P0001';
  end if;

  select count(*), coalesce(sum(stickers), 0)
    into entries_today, stickers_today
    from public.entries
   where user_id = new.user_id
     and created_at >= day_start;

  if entries_today >= 10 then
    raise exception 'limit_entries_per_day' using errcode = 'P0001';
  end if;
  if stickers_today + new.stickers > 200 then
    raise exception 'limit_stickers_per_day' using errcode = 'P0001';
  end if;

  new.hidden := false;
  new.created_at := now();
  return new;
end
$$;

drop trigger if exists entries_check on public.entries;
create trigger entries_check
  before insert on public.entries
  for each row execute function public.check_entry();

-- Nobody changes an entry after the fact, except an admin hiding it.
create or replace function public.lock_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.store_id is distinct from old.store_id
     or new.stickers is distinct from old.stickers
     or new.entry_date is distinct from old.entry_date
     or new.created_at is distinct from old.created_at then
    raise exception 'entry_locked' using errcode = 'P0001';
  end if;
  return new;
end
$$;

drop trigger if exists entries_lock on public.entries;
create trigger entries_lock
  before update on public.entries
  for each row execute function public.lock_entry();

-- Called by the app's "Save" button.
create or replace function public.log_stickers(p_store_id text, p_stickers integer, p_date date)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_id bigint;
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where user_id = uid) then
    raise exception 'no_nickname' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'unknown_store' using errcode = 'P0001';
  end if;

  insert into public.entries (user_id, store_id, stickers, entry_date)
  values (uid, p_store_id, p_stickers, p_date)
  returning id into new_id;

  return json_build_object(
    'id', new_id,
    'shrimp_helped', round(p_stickers * public.shrimp_per_sticker())
  );
end
$$;

-- The caller's own entries, newest first, with the store's address.
create or replace function public.my_entries()
returns table (id bigint, stickers integer, entry_date date, hidden boolean, store_name text, street text, city text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.stickers, e.entry_date, e.hidden, s.name, s.street, s.city
    from public.entries e
    join public.stores s on s.id = e.store_id
   where e.user_id = auth.uid()
   order by e.entry_date desc, e.id desc
   limit 500
$$;

create or replace function public.delete_my_entry(p_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.entries where id = p_id and user_id = auth.uid()
$$;

-- "Delete all my data": entries, reports, nickname and the anonymous login itself.
create or replace function public.delete_my_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  delete from public.reports where reporter_id = uid;
  delete from public.profiles where user_id = uid;  -- entries and reports about this person go with it
  -- Also remove the anonymous login. If the platform ever refuses this, the
  -- person's data above is still deleted; the empty login expires on its own.
  begin
    delete from auth.users where id = uid;
  exception when insufficient_privilege then
    null;
  end;
end
$$;
