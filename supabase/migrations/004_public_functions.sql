-- ShrimpHero database, step 4 of 6: the only ways public numbers leave the database.
-- Hidden entries and blocked people never count.

create or replace function public.public_totals()
returns table (total_stickers bigint, shrimp_helped bigint, shrimp_per_sticker numeric)
language sql
stable
security definer
set search_path = ''
as $$
  with t as (
    select coalesce(sum(e.stickers), 0)::bigint as total
      from public.entries e
      join public.profiles p on p.user_id = e.user_id
     where not e.hidden and not p.blocked
  )
  select t.total,
         round(t.total * public.shrimp_per_sticker())::bigint,
         public.shrimp_per_sticker()
    from t
$$;

create or replace function public.impact_settings()
returns table (s numeric, p numeric, n numeric, per_sticker numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select (select value from public.settings where key = 'S'),
         (select value from public.settings where key = 'p'),
         (select value from public.settings where key = 'N'),
         public.shrimp_per_sticker()
$$;

-- Top 50: nickname and total only.
create or replace function public.leaderboard()
returns table (rank bigint, nickname text, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select p.nickname, sum(e.stickers)::bigint as total, min(e.created_at) as first_at
      from public.entries e
      join public.profiles p on p.user_id = e.user_id
     where not e.hidden and not p.blocked
     group by p.user_id, p.nickname
  )
  select rank() over (order by total desc), nickname, total
    from totals
   order by total desc, first_at asc
   limit 50
$$;

-- The caller's own rank and total (rank is null before the first entry).
create or replace function public.my_rank()
returns table (rank bigint, total bigint, nickname text)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select e.user_id, sum(e.stickers)::bigint as total
      from public.entries e
      join public.profiles p on p.user_id = e.user_id
     where not e.hidden and not p.blocked
     group by e.user_id
  ),
  ranked as (
    select user_id, total, rank() over (order by total desc) as rank from totals
  )
  select r.rank, coalesce(r.total, 0), p.nickname
    from public.profiles p
    left join ranked r on r.user_id = p.user_id
   where p.user_id = auth.uid()
$$;

-- One row per store that has stickers. No nicknames, no dates.
create or replace function public.store_map()
returns table (store_id text, lat double precision, lng double precision, street text, city text, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.lat, s.lng, s.street, s.city, sum(e.stickers)::bigint
    from public.entries e
    join public.profiles p on p.user_id = e.user_id
    join public.stores s on s.id = e.store_id
   where not e.hidden and not p.blocked
   group by s.id
$$;

-- Store search by city, street, postcode.
create or replace function public.search_stores(q text)
returns table (id text, name text, street text, city text, postcode text, country text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name, s.street, s.city, s.postcode, s.country
    from public.stores s
   where char_length(btrim(coalesce(q, ''))) >= 2
     and s.search_text like '%' || replace(replace(replace(public.normalize_text(btrim(q)), '\', '\\'), '%', '\%'), '_', '\_') || '%'
   order by (public.normalize_text(coalesce(s.city, '')) like public.normalize_text(btrim(q)) || '%') desc, s.city, s.street
   limit 20
$$;

-- The 10 nearest stores to a point (the app rounds the point to about 1 km first). Nothing is stored.
create or replace function public.nearby_stores(p_lat double precision, p_lng double precision)
returns table (id text, name text, street text, city text, postcode text, country text, km numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name, s.street, s.city, s.postcode, s.country,
         round((111.2 * sqrt(power(s.lat - p_lat, 2) + power((s.lng - p_lng) * cos(radians(p_lat)), 2)))::numeric, 1)
    from public.stores s
   where p_lat between -90 and 90 and p_lng between -180 and 180
     and s.lat between p_lat - 0.5 and p_lat + 0.5
     and s.lng between p_lng - 0.8 and p_lng + 0.8
   order by power(s.lat - p_lat, 2) + power((s.lng - p_lng) * cos(radians(p_lat)), 2)
   limit 10
$$;

-- Report a nickname. Up to 20 reports per person per day; one report per nickname.
create or replace function public.report_nickname(nick text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  target uuid;
  today_start timestamptz := ((now() at time zone 'Europe/Paris')::date::timestamp at time zone 'Europe/Paris');
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('report' || uid::text, 0));
  if (select count(*) from public.reports where reporter_id = uid and created_at >= today_start) >= 20 then
    raise exception 'limit_reports_per_day' using errcode = 'P0001';
  end if;
  select user_id into target from public.profiles
   where public.normalize_text(nickname) = public.normalize_text(btrim(nick));
  if target is null or target = uid then
    return;
  end if;
  insert into public.reports (reporter_id, reported_id) values (uid, target)
  on conflict (reporter_id, reported_id) do nothing;
end
$$;

-- Admin only (run in the SQL Editor): copy rows from stores_import into stores.
create or replace function public.merge_store_import()
returns text
language plpgsql
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.stores (id, name, street, city, postcode, country, lat, lng)
  select distinct on (id)
         id, coalesce(nullif(btrim(name), ''), 'Lidl'), nullif(btrim(street), ''), nullif(btrim(city), ''),
         nullif(btrim(postcode), ''), upper(btrim(country)), lat, lng
    from public.stores_import
   where id is not null and lat is not null and lng is not null and country ~* '^[a-z]{2}$'
  on conflict (id) do update
     set name = excluded.name, street = excluded.street, city = excluded.city,
         postcode = excluded.postcode, country = excluded.country, lat = excluded.lat, lng = excluded.lng;
  get diagnostics n = row_count;
  truncate public.stores_import;
  return n || ' stores imported';
end
$$;
