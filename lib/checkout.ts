/**
 * Link de pago (Mercado Pago u otro). Debe ser URL absoluta https.
 * Si falta, los CTAs de Premium apuntan a /pricing.
 */
export function getPremiumCheckoutHref(): string {
  const v = process.env.NEXT_PUBLIC_MERCADOPAGO_CHECKOUT_URL?.trim()
  if (v && /^https?:\/\//i.test(v)) return v
  return "/pricing"
}

export function isExternalCheckoutUrl(href: string) {
  return href.startsWith("http")
}
