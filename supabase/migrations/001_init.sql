create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  explanation text,
  category_id uuid references public.categories(id) on delete set null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  source text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  is_correct boolean not null,
  mode text not null check (mode in ('practice', 'exam')),
  session_id uuid,
  answered_at timestamptz not null default now()
);

create table if not exists public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_questions integer not null default 30,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  score_percentage numeric(5,2) not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.exam_session_questions (
  id uuid primary key default gen_random_uuid(),
  exam_session_id uuid not null references public.exam_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  is_correct boolean,
  order_index integer not null
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create unique index if not exists idx_question_options_one_correct
on public.question_options(question_id)
where is_correct = true;

create index if not exists idx_questions_active on public.questions(is_active);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_answers_user on public.user_answers(user_id);
create index if not exists idx_answers_question on public.user_answers(question_id);
create index if not exists idx_exam_sessions_user on public.exam_sessions(user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_questions_updated_at on public.questions;
create trigger trg_questions_updated_at
before update on public.questions
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

create or replace function public.user_weak_categories(p_user_id uuid)
returns table(category_id uuid, category_name text, wrong_count bigint) as $$
  select c.id as category_id, c.name as category_name, count(*) as wrong_count
  from public.user_answers ua
  join public.questions q on q.id = ua.question_id
  left join public.categories c on c.id = q.category_id
  where ua.user_id = p_user_id and ua.is_correct = false
  group by c.id, c.name
  order by wrong_count desc
  limit 10;
$$ language sql stable security definer;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.user_answers enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.exam_session_questions enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_manage" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "questions_public_active_read" on public.questions for select using (is_active = true or public.is_admin());
create policy "questions_admin_manage" on public.questions for all using (public.is_admin()) with check (public.is_admin());

create policy "options_public_read" on public.question_options for select using (true);
create policy "options_admin_manage" on public.question_options for all using (public.is_admin()) with check (public.is_admin());

create policy "practice_own_read" on public.practice_sessions for select using (auth.uid() = user_id or public.is_admin());
create policy "practice_own_insert" on public.practice_sessions for insert with check (auth.uid() = user_id or public.is_admin());
create policy "practice_own_update" on public.practice_sessions for update using (auth.uid() = user_id or public.is_admin());

create policy "answers_own_read" on public.user_answers for select using (auth.uid() = user_id or public.is_admin());
create policy "answers_own_insert" on public.user_answers for insert with check (auth.uid() = user_id or public.is_admin());

create policy "exams_own_manage" on public.exam_sessions for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "exam_questions_own_manage" on public.exam_session_questions
for all using (
  exists (
    select 1 from public.exam_sessions es
    where es.id = exam_session_id and (es.user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.exam_sessions es
    where es.id = exam_session_id and (es.user_id = auth.uid() or public.is_admin())
  )
);

create policy "subscriptions_own_manage" on public.subscriptions for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
