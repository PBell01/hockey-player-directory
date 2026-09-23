create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  position text not null check (btrim(position) <> ''),
  team_org_label text not null check (btrim(team_org_label) <> ''),
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  opponent text not null check (btrim(opponent) <> ''),
  game_date date not null,
  venue text,
  home_away_status text check (
    home_away_status is null
    or home_away_status in ('home', 'away', 'neutral')
  ),
  created_at timestamptz not null default now()
);

create table public.scouting_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete restrict,
  game_id uuid not null references public.games(id) on delete restrict,
  event_type text not null check (btrim(event_type) <> ''),
  period integer check (period is null or period > 0),
  clock_time text check (
    clock_time is null
    or clock_time ~ '^[0-9]{1,2}:[0-5][0-9]$'
  ),
  notes text,
  created_at timestamptz not null default now()
);

create index players_position_idx
  on public.players (position);

create index players_team_org_label_idx
  on public.players (team_org_label);

create index games_game_date_idx
  on public.games (game_date);

create index scouting_events_player_id_idx
  on public.scouting_events (player_id);

create index scouting_events_game_id_idx
  on public.scouting_events (game_id);

create index scouting_events_player_id_game_id_idx
  on public.scouting_events (player_id, game_id);
