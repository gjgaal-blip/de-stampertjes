-- De Stampertjes v2.20 Beta 6.9.1
-- Beveiligde adminfunctie voor het verwijderen van dubbele/testspelers.
-- Wist player_stats + gekoppelde analytics-events.
-- Highscores en Café-berichten blijven bewust behouden.

begin;

create or replace function public.admin_delete_player(
  p_device_id uuid,
  p_admin_code text
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.verify_stampertjes_admin(p_admin_code) then
    return false;
  end if;

  if p_device_id is null then
    return false;
  end if;

  delete from public.stampertjes_events
  where device_id=p_device_id;

  delete from public.player_stats
  where device_id=p_device_id;

  return true;
end;
$$;

revoke all on function public.admin_delete_player(uuid,text) from public;
grant execute on function public.admin_delete_player(uuid,text) to anon, authenticated;

commit;
