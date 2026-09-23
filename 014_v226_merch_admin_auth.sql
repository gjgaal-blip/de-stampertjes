-- v2.26: use the configured admin verifier instead of a historical fixed code.
-- Run in the authenticated Supabase SQL editor after reviewing and backing up.
-- This migration does not change the configured admin credential.
begin;

create or replace function public.admin_get_merch_summary(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if public.verify_stampertjes_admin(p_key) is not true then
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
