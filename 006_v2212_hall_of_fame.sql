-- De Stampertjes v2.21.2
-- Publieke Hall of Fame-ranglijsten + persoonlijke positie.
-- Gebruikt alleen bestaande player_stats en stampertjes_events.

begin;

create or replace function public.get_hall_of_fame(
  p_device_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
with
base as (
  select
    s.device_id,
    coalesce(nullif(s.player_name,''),'SPELER') player_name,
    coalesce(s.best_score,0)::bigint score,
    coalesce(s.apples_defeated,0)::bigint apples,
    coalesce(s.highest_level,1)::bigint level,
    coalesce(s.games_played,0)::bigint games,
    coalesce(s.deaths,0)::bigint deaths,
    coalesce((
      select count(*)
      from public.stampertjes_events e
      where e.device_id=s.device_id
        and e.event_type='teddy_encounter'
    ),0)::bigint teddy,
    coalesce((
      select count(*)
      from public.stampertjes_events e
      where e.device_id=s.device_id
        and e.event_type='bonus_collect'
    ),0)::bigint bonus
  from public.player_stats s
),
score_ranked as (
  select *, dense_rank() over(order by score desc, device_id) rnk from base
),
apples_ranked as (
  select *, dense_rank() over(order by apples desc, device_id) rnk from base
),
level_ranked as (
  select *, dense_rank() over(order by level desc, score desc, device_id) rnk from base
),
games_ranked as (
  select *, dense_rank() over(order by games desc, device_id) rnk from base
),
teddy_ranked as (
  select *, dense_rank() over(order by teddy desc, device_id) rnk from base
),
bonus_ranked as (
  select *, dense_rank() over(order by bonus desc, device_id) rnk from base
),
deaths_ranked as (
  select *, dense_rank() over(order by deaths desc, device_id) rnk from base
),
first_teddy as (
  select
    e.device_id,
    coalesce(nullif(s.player_name,''),'SPELER') player_name,
    min(e.created_at) found_at
  from public.stampertjes_events e
  join public.player_stats s on s.device_id=e.device_id
  where e.event_type='teddy_encounter'
  group by e.device_id,s.player_name
  order by found_at asc
  limit 1
),
first_easter as (
  select
    e.device_id,
    coalesce(nullif(s.player_name,''),'SPELER') player_name,
    min(e.created_at) found_at
  from public.stampertjes_events e
  join public.player_stats s on s.device_id=e.device_id
  where e.event_type='teddy_easter'
  group by e.device_id,s.player_name
  order by found_at asc
  limit 1
)
select jsonb_build_object(
  'podium',coalesce((
    select jsonb_agg(jsonb_build_object(
      'device_id',device_id,
      'player_name',player_name,
      'value',score
    ) order by score desc)
    from (select * from score_ranked where score>0 order by score desc limit 3) q
  ),'[]'::jsonb),

  'leaderboards',jsonb_build_object(
    'apples',coalesce((select jsonb_agg(jsonb_build_object('device_id',device_id,'player_name',player_name,'value',apples) order by apples desc) from (select * from apples_ranked where apples>0 order by apples desc limit 5) q),'[]'::jsonb),
    'level',coalesce((select jsonb_agg(jsonb_build_object('device_id',device_id,'player_name',player_name,'value',level) order by level desc,score desc) from (select * from level_ranked where level>0 order by level desc,score desc limit 5) q),'[]'::jsonb),
    'games',coalesce((select jsonb_agg(jsonb_build_object('device_id',device_id,'player_name',player_name,'value',games) order by games desc) from (select * from games_ranked where games>0 order by games desc limit 5) q),'[]'::jsonb),
    'teddy',coalesce((select jsonb_agg(jsonb_build_object('device_id',device_id,'player_name',player_name,'value',teddy) order by teddy desc) from (select * from teddy_ranked where teddy>0 order by teddy desc limit 5) q),'[]'::jsonb),
    'bonus',coalesce((select jsonb_agg(jsonb_build_object('device_id',device_id,'player_name',player_name,'value',bonus) order by bonus desc) from (select * from bonus_ranked where bonus>0 order by bonus desc limit 5) q),'[]'::jsonb),
    'deaths',coalesce((select jsonb_agg(jsonb_build_object('device_id',device_id,'player_name',player_name,'value',deaths) order by deaths desc) from (select * from deaths_ranked where deaths>0 order by deaths desc limit 5) q),'[]'::jsonb)
  ),

  'self_ranks',jsonb_build_object(
    'score',(select jsonb_build_object('rank',rnk,'value',score) from score_ranked where device_id=p_device_id),
    'apples',(select jsonb_build_object('rank',rnk,'value',apples) from apples_ranked where device_id=p_device_id),
    'level',(select jsonb_build_object('rank',rnk,'value',level) from level_ranked where device_id=p_device_id),
    'games',(select jsonb_build_object('rank',rnk,'value',games) from games_ranked where device_id=p_device_id),
    'teddy',(select jsonb_build_object('rank',rnk,'value',teddy) from teddy_ranked where device_id=p_device_id),
    'bonus',(select jsonb_build_object('rank',rnk,'value',bonus) from bonus_ranked where device_id=p_device_id)
  ),

  'firsts',jsonb_build_object(
    'teddy_encounter',(select to_jsonb(first_teddy) from first_teddy),
    'teddy_easter',(select to_jsonb(first_easter) from first_easter)
  )
);
$$;

revoke all on function public.get_hall_of_fame(uuid) from public;
grant execute on function public.get_hall_of_fame(uuid) to anon, authenticated;

commit;
