-- Eventos de analítica propia (primera parte / servidor). Solo insert vía service role en la API.

create table if not exists public.web_analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_name text not null,
  path text,
  referrer text,
  props jsonb not null default '{}'::jsonb,
  session_id text,
  user_id uuid references auth.users (id) on delete set null,
  user_agent text
);

create index if not exists web_analytics_events_created_at_idx
  on public.web_analytics_events (created_at desc);

create index if not exists web_analytics_events_event_name_idx
  on public.web_analytics_events (event_name);

alter table public.web_analytics_events enable row level security;

comment on table public.web_analytics_events is 'Tracking propio: inserts desde /api/telemetry/event con SUPABASE_SERVICE_ROLE_KEY.';
