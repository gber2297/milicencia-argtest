-- Nombre visible cuando la pregunta no tiene category_id (LEFT JOIN devuelve NULL).

create or replace function public.user_weak_categories(p_user_id uuid)
returns table(category_id uuid, category_name text, wrong_count bigint) as $$
  select
    c.id as category_id,
    coalesce(c.name, 'Sin categoria') as category_name,
    count(*)::bigint as wrong_count
  from public.user_answers ua
  join public.questions q on q.id = ua.question_id
  left join public.categories c on c.id = q.category_id
  where ua.user_id = p_user_id and ua.is_correct = false
  group by c.id, c.name
  order by wrong_count desc
  limit 10;
$$ language sql stable security definer;
