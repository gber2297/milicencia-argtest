-- Imagen opcional por pregunta (señales, carteles, etc.): URL pública o ruta /public/...
alter table public.questions
  add column if not exists image_url text;

comment on column public.questions.image_url is 'URL https o ruta absoluta /... a imagen (señal vial, etc.)';
