-- De Stampertjes v2.22.4 — grove locatie (land/regio)
-- Slaat GEEN IP-adres en GEEN GPS-coördinaten op.

begin;

alter table public.player_stats
  add column if not exists country_code text;

alter table public.player_stats
  add column if not exists region_name text;

create or replace function public.register_player_location(
  p_device_id uuid,
  p_country_code text,
  p_region_name text default null
)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if p_device_id is null then return; end if;

  update public.player_stats
  set
    country_code = upper(left(nullif(trim(p_country_code),''),2)),
    region_name = left(nullif(trim(p_region_name),''),80),
    last_played_at = now()
  where device_id = p_device_id;
end;
$$;

revoke all on function public.register_player_location(uuid,text,text) from public;
grant execute on function public.register_player_location(uuid,text,text) to anon,authenticated;

commit;
