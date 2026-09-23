-- Scout question: for a given game, how many events (and goals) did each player log?
-- Goal events use the canonical event_type value 'goal'.

create or replace function public.player_event_counts_for_game(p_game_id uuid)
returns table (
  player_id uuid,
  player_name text,
  event_count bigint,
  goal_count bigint
)
language sql
stable
security invoker
as $$
  select
    p.id as player_id,
    p.name as player_name,
    count(se.id)::bigint as event_count,
    count(se.id) filter (where se.event_type = 'goal')::bigint as goal_count
  from public.players as p
  join public.scouting_events as se on se.player_id = p.id
  where se.game_id = p_game_id
  group by p.id, p.name
  order by event_count desc, player_name
$$;

grant execute on function public.player_event_counts_for_game(uuid)
to anon, authenticated, service_role;
