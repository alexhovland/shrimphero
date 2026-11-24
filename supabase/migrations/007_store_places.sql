-- ShrimpHero database, step 7: find stores by town or village.
-- Paste into Supabase > SQL Editor and press Run, BEFORE importing a stores.csv that has an "area" column.
-- Safe to run more than once. Keeps every store and every entry.

-- Search form of a text: lower case, no accents, and - ' ’ , treated as spaces.
create or replace function public.search_norm(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select translate(public.normalize_text(t), '-''’,', '    ')
$$;
revoke execute on function public.search_norm(text) from public, anon, authenticated;

-- Towns and villages for which this store is one of the nearest (filled by scripts/add-places.mjs).
alter table public.stores        add column if not exists area text;
alter table public.stores_import add column if not exists area text;

-- Rebuild the search column so it includes the nearby places.
drop index if exists public.stores_search_trgm;
alter table public.stores drop column if exists search_text;
alter table public.stores add column search_text text generated always as (
  public.search_norm(
    coalesce(city, '') || ' ' || coalesce(postcode, '') || ' ' ||
    coalesce(street, '') || ' ' || coalesce(name, '') || ' ' || coalesce(area, '')
  )
) stored;
create index if not exists stores_search_trgm on public.stores using gin (search_text extensions.gin_trgm_ops);

-- Store search by town, village, street or postcode.
-- Order: town starts with the search, then the search is a whole place name, then partial matches.
create or replace function public.search_stores(q text)
returns table (id text, name text, street text, city text, postcode text, country text)
language sql
stable
security definer
set search_path = ''
as $$
  with t as (select btrim(regexp_replace(public.search_norm(coalesce(q, '')), '\s+', ' ', 'g')) as term),
       e as (select term, replace(replace(replace(term, '\', '\\'), '%', '\%'), '_', '\_') as pat from t)
  select s.id, s.name, s.street, s.city, s.postcode, s.country
    from public.stores s, e
   where char_length(e.term) >= 2
     and s.search_text like '%' || e.pat || '%'
   order by (public.search_norm(coalesce(s.city, '')) like e.pat || '%') desc,
            (' ' || regexp_replace(s.search_text, '\s+', ' ', 'g') || ' ' like '% ' || e.pat || ' %') desc,
            s.city, s.street
   limit 20
$$;

-- Admin only (run in the SQL Editor): copy rows from stores_import into stores, now with "area".
create or replace function public.merge_store_import()
returns text
language plpgsql
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.stores (id, name, street, city, postcode, country, lat, lng, area)
  select distinct on (id)
         id, coalesce(nullif(btrim(name), ''), 'Lidl'), nullif(btrim(street), ''), nullif(btrim(city), ''),
         nullif(btrim(postcode), ''), upper(btrim(country)), lat, lng, nullif(btrim(area), '')
    from public.stores_import
   where id is not null and lat is not null and lng is not null and country ~* '^[a-z]{2}$'
  on conflict (id) do update
     set name = excluded.name, street = excluded.street, city = excluded.city,
         postcode = excluded.postcode, country = excluded.country, lat = excluded.lat, lng = excluded.lng,
         area = excluded.area;
  get diagnostics n = row_count;
  truncate public.stores_import;
  return n || ' stores imported';
end
$$;
revoke execute on function public.merge_store_import() from public, anon, authenticated;
