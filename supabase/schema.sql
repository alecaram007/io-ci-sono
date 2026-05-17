-- Io ci sono - Supabase schema
-- Run this in Supabase SQL editor, then add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  display_name text not null,
  avatar_url text,
  avatar_color text not null default '#c2ff45',
  age_confirmed boolean not null default false,
  friend_code text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  city text not null,
  province text not null,
  region text not null,
  country text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null default 'Europe/Rome',
  hero_color text not null default '#ff7a1a',
  vibe_tags text[] not null default '{}',
  image_url text,
  image_credit text,
  source_url text,
  popularity_score integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_not_self check (blocker_id <> blocked_id),
  constraint blocks_unique_pair unique (blocker_id, blocked_id)
);

create table if not exists public.nightly_presences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  night_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nightly_presences_unique_user_night unique (user_id, night_key)
);

create index if not exists nightly_presences_place_night_idx on public.nightly_presences(place_id, night_key);
create index if not exists places_filter_idx on public.places(country, region, province, city) where is_active = true;
create unique index if not exists friendships_unique_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.night_key_for_timezone(p_timezone text, p_moment timestamptz default now())
returns text
language plpgsql
stable
as $$
declare
  local_timestamp timestamp;
  local_date date;
begin
  local_timestamp := timezone(p_timezone, p_moment);

  if extract(hour from local_timestamp) < 6 then
    local_date := (local_timestamp::date - interval '1 day')::date;
  else
    local_date := local_timestamp::date;
  end if;

  return p_timezone || ':' || local_date::text;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();

drop trigger if exists places_touch_updated_at on public.places;
create trigger places_touch_updated_at before update on public.places for each row execute function public.touch_updated_at();

drop trigger if exists friendships_touch_updated_at on public.friendships;
create trigger friendships_touch_updated_at before update on public.friendships for each row execute function public.touch_updated_at();

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at before update on public.reports for each row execute function public.touch_updated_at();

create or replace function public.set_presence(p_place_id uuid)
returns table(place_id uuid, night_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_place places%rowtype;
  v_night_key text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_place from public.places where id = p_place_id and is_active = true;
  if not found then
    raise exception 'Place not found or inactive';
  end if;

  v_night_key := public.night_key_for_timezone(v_place.timezone, now());

  insert into public.nightly_presences(user_id, place_id, night_key)
  values (v_user_id, p_place_id, v_night_key)
  on conflict (user_id, night_key)
  do update set place_id = excluded.place_id, updated_at = now();

  return query select p_place_id, v_night_key;
end;
$$;

create or replace function public.clear_presence(p_night_key text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.nightly_presences
  where user_id = v_user_id
    and (p_night_key is null or night_key = p_night_key);
end;
$$;

create or replace function public.get_places(
  p_query text default null,
  p_city text default null,
  p_province text default null,
  p_region text default null,
  p_country text default null
)
returns table(
  id uuid,
  name text,
  category text,
  description text,
  city text,
  province text,
  region text,
  country text,
  latitude double precision,
  longitude double precision,
  timezone text,
  hero_color text,
  vibe_tags text[],
  image_url text,
  image_credit text,
  source_url text,
  popularity_score integer,
  total_count bigint,
  heat_level text,
  is_user_here boolean,
  friend_count bigint,
  visible_avatars jsonb
)
language sql
security definer
set search_path = public
as $$
  with active_places as (
    select p.*, public.night_key_for_timezone(p.timezone, now()) as current_night_key
    from public.places p
    where p.is_active = true
      and (p_city is null or p.city = p_city)
      and (p_province is null or p.province = p_province)
      and (p_region is null or p.region = p_region)
      and (p_country is null or p.country = p_country)
      and (
        p_query is null
        or p.name ilike '%' || p_query || '%'
        or p.category ilike '%' || p_query || '%'
        or p.description ilike '%' || p_query || '%'
        or p.city ilike '%' || p_query || '%'
      )
  ), counts as (
    select ap.id as place_id, count(np.id) as total_count
    from active_places ap
    left join public.nightly_presences np on np.place_id = ap.id and np.night_key = ap.current_night_key
    group by ap.id
  ), friend_ids as (
    select case
      when f.requester_id = auth.uid() then f.addressee_id
      else f.requester_id
    end as friend_id
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  ), blocked as (
    select blocked_id as user_id from public.blocks where blocker_id = auth.uid()
    union
    select blocker_id as user_id from public.blocks where blocked_id = auth.uid()
  ), visible_friends as (
    select
      np.place_id,
      p.id as friend_id,
      p.nickname,
      p.display_name,
      p.avatar_url,
      p.avatar_color,
      np.updated_at,
      row_number() over (partition by np.place_id order by np.updated_at desc) as rank_order
    from active_places ap
    join public.nightly_presences np on np.place_id = ap.id and np.night_key = ap.current_night_key
    join friend_ids fi on fi.friend_id = np.user_id
    join public.profiles p on p.id = fi.friend_id
    left join blocked b on b.user_id = p.id
    where b.user_id is null
  ), visible_friends_limited as (
    select * from visible_friends
    where rank_order <= 8
  ), friend_agg as (
    select
      place_id,
      count(*) as friend_count,
      jsonb_agg(
        jsonb_build_object(
          'id', friend_id,
          'nickname', nickname,
          'displayName', display_name,
          'avatarUrl', avatar_url,
          'avatarColor', avatar_color
        )
        order by updated_at desc
      ) as visible_avatars
    from visible_friends_limited
    group by place_id
  )
  select
    ap.id,
    ap.name,
    ap.category,
    ap.description,
    ap.city,
    ap.province,
    ap.region,
    ap.country,
    ap.latitude,
    ap.longitude,
    ap.timezone,
    ap.hero_color,
    ap.vibe_tags,
    ap.image_url,
    ap.image_credit,
    ap.source_url,
    ap.popularity_score,
    coalesce(c.total_count, 0) as total_count,
    case
      when coalesce(c.total_count, 0) >= 90 then 'wild'
      when coalesce(c.total_count, 0) >= 45 then 'hot'
      when coalesce(c.total_count, 0) >= 12 then 'warming'
      else 'quiet'
    end as heat_level,
    exists (
      select 1 from public.nightly_presences mine
      where mine.user_id = auth.uid()
        and mine.place_id = ap.id
        and mine.night_key = ap.current_night_key
    ) as is_user_here,
    coalesce(fa.friend_count, 0) as friend_count,
    coalesce(fa.visible_avatars, '[]'::jsonb) as visible_avatars
  from active_places ap
  join counts c on c.place_id = ap.id
  left join friend_agg fa on fa.place_id = ap.id
  order by is_user_here desc, total_count desc, ap.name asc;
$$;

create or replace function public.get_place_presence(p_place_id uuid)
returns table(
  total_count bigint,
  friend_id uuid,
  friend_nickname text,
  friend_display_name text,
  friend_avatar_url text,
  friend_avatar_color text
)
language sql
security definer
set search_path = public
as $$
  with selected_place as (
    select id, public.night_key_for_timezone(timezone, now()) as current_night_key
    from public.places
    where id = p_place_id and is_active = true
  ), total as (
    select count(np.id) as total_count
    from selected_place sp
    left join public.nightly_presences np on np.place_id = sp.id and np.night_key = sp.current_night_key
  ), friend_ids as (
    select case
      when f.requester_id = auth.uid() then f.addressee_id
      else f.requester_id
    end as friend_id
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  ), blocked as (
    select blocked_id as user_id from public.blocks where blocker_id = auth.uid()
    union
    select blocker_id as user_id from public.blocks where blocked_id = auth.uid()
  ), present_friends as (
    select p.id, p.nickname, p.display_name, p.avatar_url, p.avatar_color
    from selected_place sp
    join public.nightly_presences np on np.place_id = sp.id and np.night_key = sp.current_night_key
    join friend_ids fi on fi.friend_id = np.user_id
    join public.profiles p on p.id = fi.friend_id
    left join blocked b on b.user_id = p.id
    where b.user_id is null
    order by np.updated_at desc
    limit 8
  )
  select t.total_count, pf.id, pf.nickname, pf.display_name, pf.avatar_url, pf.avatar_color
  from total t
  left join present_friends pf on true;
$$;

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.nightly_presences enable row level security;
alter table public.reports enable row level security;

drop policy if exists profiles_select_self_friends_admin on public.profiles;
create policy profiles_select_self_friends_admin on public.profiles
for select using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = profiles.id) or (f.addressee_id = auth.uid() and f.requester_id = profiles.id))
  )
);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

drop policy if exists places_select_active on public.places;
create policy places_select_active on public.places
for select using (is_active = true or public.is_admin());

drop policy if exists places_admin_insert on public.places;
create policy places_admin_insert on public.places
for insert with check (public.is_admin());

drop policy if exists places_admin_update on public.places;
create policy places_admin_update on public.places
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists friendships_select_involved on public.friendships;
create policy friendships_select_involved on public.friendships
for select using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin());

drop policy if exists friendships_insert_requester on public.friendships;
create policy friendships_insert_requester on public.friendships
for insert with check (requester_id = auth.uid());

drop policy if exists friendships_update_involved on public.friendships;
create policy friendships_update_involved on public.friendships
for update using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin())
with check (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin());

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
for select using (blocker_id = auth.uid() or blocked_id = auth.uid() or public.is_admin());

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own on public.blocks
for insert with check (blocker_id = auth.uid());

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own on public.blocks
for delete using (blocker_id = auth.uid() or public.is_admin());

drop policy if exists presences_select_own_admin on public.nightly_presences;
create policy presences_select_own_admin on public.nightly_presences
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists presences_insert_own on public.nightly_presences;
create policy presences_insert_own on public.nightly_presences
for insert with check (user_id = auth.uid());

drop policy if exists presences_update_own on public.nightly_presences;
create policy presences_update_own on public.nightly_presences
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists presences_delete_own on public.nightly_presences;
create policy presences_delete_own on public.nightly_presences
for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists reports_insert_auth on public.reports;
create policy reports_insert_auth on public.reports
for insert with check (reporter_id = auth.uid());

drop policy if exists reports_select_admin_or_reporter on public.reports;
create policy reports_select_admin_or_reporter on public.reports
for select using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports
for update using (public.is_admin()) with check (public.is_admin());
