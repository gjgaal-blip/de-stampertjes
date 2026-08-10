-- De Stampertjes v2.20 Beta 6.9.6
-- Houdt de twee Teddy-ontdekkingen apart bij:
-- 1) gameplay encounter (+2000)
-- 2) verborgen Easter egg (+1000)

begin;

alter table public.player_stats
  add column if not exists teddy_encounter_found boolean not null default false,
  add column if not exists teddy_encounter_found_at timestamptz,
  add column if not exists teddy_easter_found boolean not null default false,
  add column if not exists teddy_easter_found_at timestamptz;

-- Bestaande event-check uitbreiden met de twee specifieke Teddy-events.
alter table public.stampertjes_events
  drop constraint if exists stampertjes_events_type_chk;

alter table public.stampertjes_events
  add constraint stampertjes_events_type_chk check (
    event_type in (
      'game_start','game_over','level_start','level_complete',
      'death','bonus_spawn','bonus_collect','teddy_found',
      'teddy_encounter','teddy_easter'
    )
  );

create or replace function public.register_teddy_discovery(
  p_device_id uuid,
  p_player_name text,
  p_discovery_type text,
  p_level integer default null,
  p_score integer default null,
  p_platform text default null,
  p_game_version text default null
)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if p_device_id is null then raise exception 'device_id required'; end if;
  if p_discovery_type not in ('encounter','easter') then
    raise exception 'invalid teddy discovery type';
  end if;

  insert into public.player_stats(
    device_id,player_name,teddy_found,
    teddy_encounter_found,teddy_encounter_found_at,
    teddy_easter_found,teddy_easter_found_at,
    platform,last_version,first_seen,last_seen,updated_at
  )
  values(
    p_device_id,
    upper(left(coalesce(nullif(trim(p_player_name),''),'SPELER'),10)),
    true,
    p_discovery_type='encounter',
    case when p_discovery_type='encounter' then now() else null end,
    p_discovery_type='easter',
    case when p_discovery_type='easter' then now() else null end,
    left(nullif(trim(p_platform),''),30),
    left(nullif(trim(p_game_version),''),30),
    now(),now(),now()
  )
  on conflict(device_id) do update set
    player_name=case
      when excluded.player_name<>'SPELER' then excluded.player_name
      else player_stats.player_name
    end,
    teddy_found=true,
    teddy_encounter_found=player_stats.teddy_encounter_found or (p_discovery_type='encounter'),
    teddy_encounter_found_at=case
      when p_discovery_type='encounter' then coalesce(player_stats.teddy_encounter_found_at,now())
      else player_stats.teddy_encounter_found_at
    end,
    teddy_easter_found=player_stats.teddy_easter_found or (p_discovery_type='easter'),
    teddy_easter_found_at=case
      when p_discovery_type='easter' then coalesce(player_stats.teddy_easter_found_at,now())
      else player_stats.teddy_easter_found_at
    end,
    platform=coalesce(excluded.platform,player_stats.platform),
    last_version=coalesce(excluded.last_version,player_stats.last_version),
    last_seen=now(),
    updated_at=now();

  insert into public.stampertjes_events(
    device_id,event_type,level,score,platform,game_version,created_at
  ) values (
    p_device_id,
    case when p_discovery_type='encounter' then 'teddy_encounter' else 'teddy_easter' end,
    case when p_level is null then null else greatest(p_level,1) end,
    case when p_score is null then null else greatest(p_score,0) end,
    left(nullif(trim(p_platform),''),30),
    left(nullif(trim(p_game_version),''),30),
    now()
  );
end;
$$;

revoke all on function public.register_teddy_discovery(uuid,text,text,integer,integer,text,text) from public;
grant execute on function public.register_teddy_discovery(uuid,text,text,integer,integer,text,text) to anon, authenticated;

-- Developer dashboard opnieuw definiëren met aparte Teddy-lijsten.
create or replace function public.admin_get_player_dashboard(
  p_admin_code text
)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
with auth as (
  select public.verify_stampertjes_admin(p_admin_code) ok
), players as (
  select
    s.device_id,
    coalesce(nullif(s.player_name,''),'SPELER') player_name,
    s.games_played,s.best_score,s.highest_level,s.apples_defeated,
    s.deaths,s.longest_combo,s.teddy_found,
    s.teddy_encounter_found,s.teddy_encounter_found_at,
    s.teddy_easter_found,s.teddy_easter_found_at,
    s.first_seen,s.last_seen,s.platform,s.audio_mode,s.last_version,
    coalesce((select count(*) from public.community_posts c where c.device_id=s.device_id),0)::int cafe_posts,
    coalesce((select sum(c.likes) from public.community_posts c where c.device_id=s.device_id),0)::int cafe_likes
  from public.player_stats s, auth
  where auth.ok
  order by s.last_seen desc
  limit 500
), recent as (
  select e.device_id,e.event_type,e.level,e.score,e.bonus_type,e.room,e.platform,e.game_version,e.created_at
  from public.stampertjes_events e, auth
  where auth.ok
  order by e.created_at desc
  limit 250
), activity as (
  select
    count(*) filter(where last_seen>=now()-interval '24 hours')::int active_24h,
    count(*) filter(where last_seen>=now()-interval '7 days')::int active_7d,
    count(*) filter(where first_seen>=now()-interval '7 days')::int new_7d
  from public.player_stats, auth where auth.ok
), levels as (
  select level,
    count(*) filter(where event_type='level_start')::int starts,
    count(*) filter(where event_type='level_complete')::int completes,
    count(*) filter(where event_type='death')::int deaths
  from public.stampertjes_events, auth
  where auth.ok and level is not null
  group by level order by level
), bonuses as (
  select bonus_type,
    count(*) filter(where event_type='bonus_spawn')::int spawned,
    count(*) filter(where event_type='bonus_collect')::int collected
  from public.stampertjes_events, auth
  where auth.ok and bonus_type is not null
  group by bonus_type order by bonus_type
), platforms as (
  select coalesce(nullif(platform,''),'ONBEKEND') platform,count(*)::int players
  from public.player_stats, auth where auth.ok
  group by 1 order by 2 desc
), audio as (
  select coalesce(nullif(audio_mode,''),'ONBEKEND') audio_mode,count(*)::int players
  from public.player_stats, auth where auth.ok
  group by 1 order by 2 desc
), teddy_encounters as (
  select device_id,coalesce(nullif(player_name,''),'SPELER') player_name,
         teddy_encounter_found_at found_at
  from public.player_stats, auth
  where auth.ok and teddy_encounter_found
  order by teddy_encounter_found_at desc nulls last
), teddy_easters as (
  select device_id,coalesce(nullif(player_name,''),'SPELER') player_name,
         teddy_easter_found_at found_at
  from public.player_stats, auth
  where auth.ok and teddy_easter_found
  order by teddy_easter_found_at desc nulls last
)
select case when public.verify_stampertjes_admin(p_admin_code) then
  jsonb_build_object(
    'players',coalesce((select jsonb_agg(to_jsonb(players)) from players),'[]'::jsonb),
    'recent_events',coalesce((select jsonb_agg(to_jsonb(recent)) from recent),'[]'::jsonb),
    'activity',(select to_jsonb(activity) from activity),
    'levels',coalesce((select jsonb_agg(to_jsonb(levels)) from levels),'[]'::jsonb),
    'bonuses',coalesce((select jsonb_agg(to_jsonb(bonuses)) from bonuses),'[]'::jsonb),
    'platforms',coalesce((select jsonb_agg(to_jsonb(platforms)) from platforms),'[]'::jsonb),
    'audio_modes',coalesce((select jsonb_agg(to_jsonb(audio)) from audio),'[]'::jsonb),
    'teddy_encounter_finders',coalesce((select jsonb_agg(to_jsonb(teddy_encounters)) from teddy_encounters),'[]'::jsonb),
    'teddy_easter_finders',coalesce((select jsonb_agg(to_jsonb(teddy_easters)) from teddy_easters),'[]'::jsonb)
  )
else null end;
$$;

revoke all on function public.admin_get_player_dashboard(text) from public;
grant execute on function public.admin_get_player_dashboard(text) to anon, authenticated;

commit;
