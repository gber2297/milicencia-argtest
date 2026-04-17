-- 004 activó RLS sin políticas: los inserts vía PostgREST fallan con 42501.
-- Solo la API (JWT role = service_role) debe insertar.

drop policy if exists "web_analytics_events_insert_service_role" on public.web_analytics_events;

create policy "web_analytics_events_insert_service_role"
  on public.web_analytics_events
  for insert
  with check (auth.role() = 'service_role');

comment on policy "web_analytics_events_insert_service_role" on public.web_analytics_events is
  'Inserts solo con SUPABASE_SERVICE_ROLE_KEY; anon/authenticated no pasan el check.';
