create table public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_events enable row level security;
