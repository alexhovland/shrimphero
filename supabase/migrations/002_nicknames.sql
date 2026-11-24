-- ShrimpHero database, step 2 of 6: nickname rules.

-- Returns null when the nickname is fine, or the reason it is refused.
create or replace function public.nickname_problem(nick text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  n text;
  look_i text;   -- digits read as letters, 1 read as i
  look_l text;   -- same, 1 read as l
  squashed_i text;
  squashed_l text;
  words text[];
  t record;
begin
  if nick is null or char_length(nick) < 3 then
    return 'nickname_too_short';
  end if;
  if char_length(nick) > 20 then
    return 'nickname_too_long';
  end if;
  -- Letters used in French, English, German, Italian, Polish, Spanish, Dutch, Czech, Hungarian,
  -- plus digits, space, hyphen and underscore.
  if nick !~ '^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ſ _-]+$' then
    return 'nickname_characters';
  end if;
  if nick ~ '^[ _-]' or nick ~ '[ _-]$' or nick ~ '[ _-]{2,}' then
    return 'nickname_spacing';
  end if;

  n := public.normalize_text(nick);
  look_i := translate(n, '0134578', 'oieastb');
  look_l := translate(n, '0134578', 'oleastb');
  squashed_i := regexp_replace(look_i, '[ _-]', '', 'g');
  squashed_l := regexp_replace(look_l, '[ _-]', '', 'g');
  words := string_to_array(regexp_replace(look_i, '[ _-]+', ' ', 'g'), ' ')
        || string_to_array(regexp_replace(look_l, '[ _-]+', ' ', 'g'), ' ');

  -- Anything that reads like a web address.
  if squashed_i ~ '(www|http)'
     or n ~ '[ _-](com|net|org|info|eu|fr|de|it|pl|es|uk|ie|be|ch|at|nl|io|ly|co|me)$' then
    return 'nickname_link';
  end if;

  if n ~ '(1488|(^|[ _-])88($|[ _-]))' then
    return 'nickname_blocked';
  end if;

  for t in select term, match from public.nickname_blocklist loop
    if t.match = 'contains' then
      if position(t.term in squashed_i) > 0 or position(t.term in squashed_l) > 0 then
        return 'nickname_blocked';
      end if;
    else
      if t.term = any (words) or squashed_i = t.term or squashed_l = t.term then
        return 'nickname_blocked';
      end if;
    end if;
  end loop;

  return null;
end
$$;

-- Applies the rules to every insert or rename, including renames made by an admin.
create or replace function public.check_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  problem text;
begin
  new.nickname := btrim(new.nickname);
  problem := public.nickname_problem(new.nickname);
  if problem is not null then
    raise exception '%', problem using errcode = 'P0001';
  end if;
  return new;
end
$$;

drop trigger if exists profiles_check on public.profiles;
create trigger profiles_check
  before insert or update of nickname on public.profiles
  for each row execute function public.check_profile();

-- Called by the app after the first anonymous sign-in, and to change the nickname later.
create or replace function public.set_nickname(nick text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean text := btrim(nick);
  problem text;
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where user_id = uid and blocked) then
    raise exception 'blocked' using errcode = 'P0001';
  end if;
  problem := public.nickname_problem(clean);
  if problem is not null then
    raise exception '%', problem using errcode = 'P0001';
  end if;
  begin
    insert into public.profiles (user_id, nickname)
    values (uid, clean)
    on conflict (user_id) do update set nickname = excluded.nickname;
  exception when unique_violation then
    raise exception 'nickname_taken' using errcode = 'P0001';
  end;
  return clean;
end
$$;
