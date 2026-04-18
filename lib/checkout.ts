/**
 * Plan semanal (suscripción Mercado Pago). Sobrescribible con env.
 */
const DEFAULT_WEEKLY_MERCADOPAGO_CHECKOUT =
  "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=b3884f5022364f148196ca16e34682b5"

/**
 * Link de pago plan mensual / Premium genérico (Mercado Pago u otro). Debe ser URL absoluta https.
 * Si falta, los CTAs apuntan a /pricing.
 */
export function getPremiumCheckoutHref(): string {
  const v = process.env.NEXT_PUBLIC_MERCADOPAGO_CHECKOUT_URL?.trim()
  if (v && /^https?:\/\//i.test(v)) return v
  return "/pricing"
}

/** Checkout de suscripción Mercado Pago para el plan semanal. */
export function getWeeklyCheckoutHref(): string {
  const v = process.env.NEXT_PUBLIC_MERCADOPAGO_CHECKOUT_URL_SEMANAL?.trim()
  if (v && /^https?:\/\//i.test(v)) return v
  return DEFAULT_WEEKLY_MERCADOPAGO_CHECKOUT
}

export function isExternalCheckoutUrl(href: string) {
  return href.startsWith("http")
}
