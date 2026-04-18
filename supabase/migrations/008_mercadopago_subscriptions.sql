-- Mercado Pago Suscripciones (preapproval): vínculo para webhooks y soporte.

alter table public.subscriptions
  add column if not exists mercadopago_preapproval_id text,
  add column if not exists mercadopago_plan_key text;

create unique index if not exists subscriptions_mercadopago_preapproval_id_key
  on public.subscriptions (mercadopago_preapproval_id)
  where mercadopago_preapproval_id is not null;

comment on column public.subscriptions.mercadopago_preapproval_id is 'ID de preapproval en Mercado Pago (suscripción).';
comment on column public.subscriptions.mercadopago_plan_key is 'weekly | monthly — referencia del plan de MP usado al dar de alta.';
