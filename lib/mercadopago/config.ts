export type MercadoPagoPlanKey = "weekly" | "monthly"

function normalizeSecret(raw: string | undefined) {
  if (!raw) return ""
  let s = raw.trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  return s
}

/** Access token de la aplicación (solo servidor). */
export function getMercadoPagoAccessToken(): string {
  return normalizeSecret(process.env.MERCADOPAGO_ACCESS_TOKEN)
}

/** Plan semanal / mensual creado en MP (preapproval_plan id). Opcional si usás solo API sin plan. */
export function getMercadoPagoPreapprovalPlanId(plan: MercadoPagoPlanKey): string | null {
  const key =
    plan === "weekly"
      ? process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_WEEKLY
      : process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY
  const v = normalizeSecret(key)
  return v || null
}

/** Montos ARS (sin plan asociado en POST /preapproval — mismo criterio que /pricing). */
export function getPlanAmountArs(plan: MercadoPagoPlanKey): number {
  if (plan === "weekly") {
    return Number(process.env.MERCADOPAGO_PLAN_AMOUNT_WEEKLY ?? "4990")
  }
  return Number(process.env.MERCADOPAGO_PLAN_AMOUNT_MONTHLY ?? "8990")
}

/**
 * Recurrencia para POST /preapproval sin `preapproval_plan_id` (flujo pending + init_point).
 * Con plan asociado, MP exige `card_token_id`; sin plan podés redirigir al checkout de MP.
 */
export function getAutoRecurringForPlan(plan: MercadoPagoPlanKey) {
  const amount = getPlanAmountArs(plan)
  if (plan === "weekly") {
    return {
      frequency: 7,
      frequency_type: "days" as const,
      transaction_amount: amount,
      currency_id: "ARS",
    }
  }
  return {
    frequency: 1,
    frequency_type: "months" as const,
    transaction_amount: amount,
    currency_id: "ARS",
  }
}

/**
 * true si hay Access Token. El flujo de suscripción usa POST /preapproval sin plan asociado
 * (montos vía MERCADOPAGO_PLAN_AMOUNT_*). Los preapproval_plan_id son opcionales (links manuales).
 */
export function isMercadoPagoSubscriptionsApiConfigured(): boolean {
  return Boolean(getMercadoPagoAccessToken())
}
