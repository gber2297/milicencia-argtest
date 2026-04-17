-- Tabla solo para inserts desde la API (JWT role = service_role).
-- RLS + políticas con auth.role() sigue pudiendo dar 42501 según contexto PostgREST.
-- Sin RLS: los permisos quedan claros solo en Postgres.

alter table public.web_analytics_events disable row level security;

drop policy if exists "web_analytics_events_insert_service_role" on public.web_analytics_events;

revoke all on public.web_analytics_events from public;
grant insert, select on public.web_analytics_events to service_role;

comment on table public.web_analytics_events is
  'Tracking: INSERT/SELECT solo rol service_role (API con SUPABASE_SERVICE_ROLE_KEY).';
