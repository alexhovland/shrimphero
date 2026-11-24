-- ShrimpHero database, step 1 of 6: extensions and tables.
-- Paste into Supabase > SQL Editor and press Run.

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Lower case, no accents. Used for nickname uniqueness and store search.
create or replace function public.normalize_text(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, '')))
$$;

-- Impact numbers (S, p, N). Admins edit them in the Table Editor.
create table if not exists public.settings (
  key text primary key,
  value numeric not null check (value >= 0),
  description text
);

-- Lidl stores from OpenStreetMap.
create table if not exists public.stores (
  id text primary key,
  name text not null default 'Lidl',
  street text,
  city text,
  postcode text,
  country text not null check (country ~ '^[A-Z]{2}$'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  search_text text generated always as (
    public.normalize_text(
      coalesce(city, '') || ' ' || coalesce(postcode, '') || ' ' ||
      coalesce(street, '') || ' ' || coalesce(name, '')
    )
  ) stored
);
create index if not exists stores_search_trgm on public.stores using gin (search_text extensions.gin_trgm_ops);
create index if not exists stores_lat_lng on public.stores (lat, lng);

-- CSV imports land here first, then merge_store_import() copies them into stores.
create table if not exists public.stores_import (
  id text,
  name text,
  street text,
  city text,
  postcode text,
  country text,
  lat double precision,
  lng double precision
);

-- One row per person. user_id is the anonymous Supabase user id.
-- No link to auth.users on purpose: removing old anonymous logins never wipes the leaderboard.
create table if not exists public.profiles (
  user_id uuid primary key,
  nickname text not null,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_nickname_unique on public.profiles (public.normalize_text(nickname));

create table if not exists public.entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  store_id text not null references public.stores (id),
  stickers integer not null check (stickers between 1 and 50),
  entry_date date not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists entries_user_created on public.entries (user_id, created_at);
create index if not exists entries_store on public.entries (store_id);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null,
  reported_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  reviewed boolean not null default false,
  unique (reporter_id, reported_id)
);
create index if not exists reports_reporter_created on public.reports (reporter_id, created_at);

-- Words and names a nickname may not contain. Admins can add rows.
-- match = 'contains': blocked anywhere in the nickname (spaces and look-alike digits ignored).
-- match = 'word': blocked only as a whole word, for short words that hide inside normal ones.
create table if not exists public.nickname_blocklist (
  term text primary key check (term = lower(term)),
  match text not null default 'contains' check (match in ('contains', 'word'))
);
