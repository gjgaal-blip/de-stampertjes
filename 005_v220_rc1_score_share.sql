-- De Stampertjes v2.20 RC1
begin;
alter table public.stampertjes_events drop constraint if exists stampertjes_events_type_chk;
alter table public.stampertjes_events add constraint stampertjes_events_type_chk check (
 event_type in ('game_start','game_over','level_start','level_complete','death','bonus_spawn','bonus_collect','teddy_found','teddy_encounter','teddy_easter','score_share')
);
commit;
