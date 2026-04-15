/**
 * Stripe (futuro): usar variables de entorno y webhooks para activar plan premium.
 *
 * STRIPE_SECRET_KEY
 * STRIPE_WEBHOOK_SECRET
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
} as const
