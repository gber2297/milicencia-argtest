import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { getPreapproval } from "@/lib/mercadopago/preapproval"

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  )
}

/** Alineado con isPremiumSubscription: premium + active = acceso completo. */
export async function syncSubscriptionFromPreapprovalId(preapprovalId: string) {
  const pre = await getPreapproval(preapprovalId)
  if (!pre.ok) return { ok: false as const, error: pre.error }

  const userId = pre.external_reference?.trim() ?? ""
  if (!userId || !isUuid(userId)) {
    return { ok: false as const, error: "external_reference inválido" }
  }

  const admin = tryCreateAdminClient()
  if (!admin) {
    return { ok: false as const, error: "SUPABASE_SERVICE_ROLE_KEY no configurada" }
  }

  if (pre.status === "authorized") {
    const { error } = await admin
      .from("subscriptions")
      .update({
        plan: "premium",
        status: "active",
        mercadopago_preapproval_id: pre.id,
      })
      .eq("user_id", userId)
    if (error) return { ok: false as const, error: error.message }
    return { ok: true as const, action: "authorized" as const }
  }

  if (pre.status === "cancelled" || pre.status === "paused") {
    const { data: row } = await admin
      .from("subscriptions")
      .select("mercadopago_preapproval_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (row?.mercadopago_preapproval_id === pre.id) {
      const { error } = await admin
        .from("subscriptions")
        .update({
          plan: "free",
          status: "active",
          mercadopago_preapproval_id: null,
          mercadopago_plan_key: null,
        })
        .eq("user_id", userId)
      if (error) return { ok: false as const, error: error.message }
    }
    return { ok: true as const, action: "downgraded" as const }
  }

  return { ok: true as const, action: "noop" as const, status: pre.status }
}
