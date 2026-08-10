-- De Stampertjes v2.22.7
-- Developer Portal: handmatige highscore met level + eigen datum/tijd.

begin;

create or replace function public.admin_add_highscore(
  p_admin_code text,
  p_name text,
  p_score integer,
  p_level integer default 1,
  p_created_at timestamptz default now()
)
returns bigint
language plpgsql
security definer
set search_path=public
as $$
declare
  new_id bigint;
begin
  if public.verify_stampertjes_admin(p_admin_code) is not true then
    raise exception 'unauthorized';
  end if;

  if coalesce(p_score,0) <= 0 then
    raise exception 'score must be greater than zero';
  end if;

  insert into public.highscores(name,score,level,is_manual,created_at)
  values(
    left(coalesce(nullif(trim(p_name),''),'SPELER'),30),
    p_score,
    greatest(coalesce(p_level,1),1),
    true,
    coalesce(p_created_at,now())
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.admin_add_highscore(text,text,integer,integer,timestamptz) from public;
grant execute on function public.admin_add_highscore(text,text,integer,integer,timestamptz) to anon,authenticated;

commit;
