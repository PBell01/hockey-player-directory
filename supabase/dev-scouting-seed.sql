-- Development-only scouting fixture data.
-- Safe to rerun: existing fixture rows are removed first.

delete from public.scouting_events;
delete from public.games;
delete from public.players;

insert into public.players (id, name, position, team_org_label, notes)
values
  ('11111111-1111-4111-8111-111111111111', 'Alex Mercer', 'F', 'Toronto', 'Development fixture'),
  ('22222222-2222-4222-8222-222222222222', 'Brody Stone', 'D', 'Toronto', 'Development fixture'),
  ('33333333-3333-4333-8333-333333333333', 'Carter Quinn', 'G', 'Toronto', 'Development fixture'),
  ('44444444-4444-4444-8444-444444444444', 'Dylan Price', 'F', 'Buffalo', 'Development fixture'),
  ('55555555-5555-4555-8555-555555555555', 'Evan Brooks', 'D', 'Buffalo', 'Development fixture'),
  ('66666666-6666-4666-8666-666666666666', 'Finn Clarke', 'G', 'Buffalo', 'Development fixture');

insert into public.games (id, opponent, game_date, venue, home_away_status)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Buffalo Sabres', '2026-01-15', null, 'home'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Toronto Maple Leafs', '2026-02-01', null, 'away'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Rochester Americans', '2026-02-12', null, 'home');

insert into public.scouting_events
  (player_id, game_id, event_type, period, clock_time, notes)
values
  -- Game 1: Alex = 3 events / 1 goal
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'goal', 1, '05:20', 'Development fixture'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'shot', 2, '11:10', 'Development fixture'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'hit', 3, '14:30', 'Development fixture'),

  -- Game 1: Brody = 2 events / 0 goals
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'hit', 1, '08:00', 'Development fixture'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'blocked_shot', 2, '16:40', 'Development fixture'),

  -- Game 1: Carter = 1 event / 0 goals
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'save', 1, '03:15', 'Development fixture'),

  -- Game 2: Dylan = 2 events / 1 goal
  ('44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'goal', 2, '09:00', 'Development fixture'),
  ('44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'shot', 3, '12:25', 'Development fixture'),

  -- Game 2: Evan = 1 event / 0 goals
  ('55555555-5555-4555-8555-555555555555', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'hit', 2, '07:45', 'Development fixture'),

  -- Game 3: Finn = 2 events / 0 goals
  ('66666666-6666-4666-8666-666666666666', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'save', 1, '04:00', 'Development fixture'),
  ('66666666-6666-4666-8666-666666666666', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'save', 3, '18:10', 'Development fixture');
