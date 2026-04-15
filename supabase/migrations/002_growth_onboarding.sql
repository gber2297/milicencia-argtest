-- Growth: onboarding preferences, daily usage, subscription uniqueness, streak

-- Subscriptions: one row per user + Stripe placeholders (dedupe legacy rows if any)
delete from public.subscriptions a
  using public.subscriptions b
 where a.user_id = b.user_id
   and a.ctid < b.ctid;

create unique index if not exists subscriptions_user_id_key on public.subscriptions (user_id);

alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

update public.subscriptions set plan = 'free' where plan is null;

-- Daily usage (UTC date; client may show local — keep single source)
create table if not exists public.user_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default ((now() at time zone 'utc'))::date,
  questions_answered integer not null default 0 check (questions_answered >= 0),
  exams_started integer not null default 0 check (exams_started >= 0),
  primary key (user_id, usage_date)
);

create index if not exists idx_user_usage_user_date on public.user_usage (user_id, usage_date desc);

-- Preferences + onboarding + streak
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text,
  experience_level text,
  weak_category_slugs text[] default '{}',
  onboarding_completed boolean not null default true,
  streak_count integer not null default 0 check (streak_count >= 0),
  last_practice_date date
);

alter table public.user_usage enable row level security;
alter table public.user_preferences enable row level security;

create policy "usage_own_select" on public.user_usage for select using (auth.uid() = user_id);
create policy "usage_own_insert" on public.user_usage for insert with check (auth.uid() = user_id);
create policy "usage_own_update" on public.user_usage for update using (auth.uid() = user_id);

create policy "prefs_own_select" on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs_own_insert" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "prefs_own_update" on public.user_preferences for update using (auth.uid() = user_id);

-- Bootstrap rows for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user')
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id, onboarding_completed)
  values (new.id, false)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing profiles
insert into public.subscriptions (user_id, plan, status)
select p.id, 'free', 'active'
from public.profiles p
where not exists (select 1 from public.subscriptions s where s.user_id = p.id)
on conflict (user_id) do nothing;

insert into public.user_preferences (user_id)
select p.id from public.profiles p
where not exists (select 1 from public.user_preferences up where up.user_id = p.id);

-- Atomic counters (RLS still applies via security definer + auth check)
create or replace function public.bump_practice_usage(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_date date := (timezone('utc', now()))::date;
begin
  if auth.uid() is distinct from p_user_id and not public.is_admin() then
    raise exception 'not allowed';
  end if;

  insert into public.user_usage (user_id, usage_date, questions_answered)
  values (p_user_id, v_date, 1)
  on conflict (user_id, usage_date)
  do update set questions_answered = public.user_usage.questions_answered + 1
  returning public.user_usage.questions_answered into v_count;

  return v_count;
end;
$$;

create or replace function public.bump_exam_start(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_date date := (timezone('utc', now()))::date;
begin
  if auth.uid() is distinct from p_user_id and not public.is_admin() then
    raise exception 'not allowed';
  end if;

  insert into public.user_usage (user_id, usage_date, exams_started)
  values (p_user_id, v_date, 1)
  on conflict (user_id, usage_date)
  do update set exams_started = public.user_usage.exams_started + 1
  returning public.user_usage.exams_started into v_count;

  return v_count;
end;
$$;

grant execute on function public.bump_practice_usage(uuid) to authenticated;
grant execute on function public.bump_exam_start(uuid) to authenticated;
