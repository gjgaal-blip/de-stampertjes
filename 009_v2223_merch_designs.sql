-- De Stampertjes v2.22.3 — Merchandise ontwerpen
begin;

alter table public.merch_interest
  add column if not exists shirt_design text;

alter table public.merch_interest
  drop constraint if exists merch_design_check;

alter table public.merch_interest
  add constraint merch_design_check
  check (shirt_design is null or shirt_design in ('classic','boss','held'));

create or replace function public.register_merch_interest(
  p_device_id uuid,
  p_interested boolean,
  p_personalized boolean default false,
  p_shirt_size text default null,
  p_player_name text default null,
  p_shirt_design text default null
)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if p_device_id is null then return; end if;

  insert into public.merch_interest(
    device_id,interested,personalized,shirt_size,player_name,shirt_design,updated_at
  )
  values(
    p_device_id,
    coalesce(p_interested,true),
    coalesce(p_personalized,false),
    p_shirt_size,
    left(nullif(trim(p_player_name),''),30),
    case when p_shirt_design in ('classic','boss','held') then p_shirt_design else null end,
    now()
  )
  on conflict(device_id) do update set
    interested=excluded.interested,
    personalized=excluded.personalized,
    shirt_size=excluded.shirt_size,
    player_name=excluded.player_name,
    shirt_design=excluded.shirt_design,
    updated_at=now();
end;
$$;

revoke all on function public.register_merch_interest(uuid,boolean,boolean,text,text,text) from public;
grant execute on function public.register_merch_interest(uuid,boolean,boolean,text,text,text) to anon,authenticated;

create or replace function public.admin_get_merch_summary(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if p_key is distinct from 'MijnStampertjes2026!' then
    raise exception 'unauthorized';
  end if;

  return jsonb_build_object(
    'interested',(select count(*) from public.merch_interest where interested),
    'personalized',(select count(*) from public.merch_interest where interested and personalized),
    'sizes',coalesce((select jsonb_object_agg(shirt_size,cnt) from (
      select shirt_size,count(*) cnt from public.merch_interest
      where interested and shirt_size is not null group by shirt_size
    ) q),'{}'::jsonb),
    'designs',coalesce((select jsonb_object_agg(shirt_design,cnt) from (
      select shirt_design,count(*) cnt from public.merch_interest
      where interested and shirt_design is not null group by shirt_design
    ) q),'{}'::jsonb)
  );
end;
$$;

revoke all on function public.admin_get_merch_summary(text) from public;
grant execute on function public.admin_get_merch_summary(text) to anon,authenticated;

commit;
