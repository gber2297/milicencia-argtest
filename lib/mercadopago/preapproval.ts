import {
  getAutoRecurringForPlan,
  getMercadoPagoAccessToken,
} from "@/lib/mercadopago/config"
import type { MercadoPagoPlanKey } from "@/lib/mercadopago/config"

const MP_API = "https://api.mercadopago.com"

export interface MpPreapprovalResponse {
  id?: string
  status?: string
  external_reference?: string | null
  init_point?: string
  payer_email?: string | null
  message?: string
  cause?: unknown
}

export async function createPendingPreapproval(input: {
  planKey: MercadoPagoPlanKey
  payerEmail: string
  externalReference: string
  backUrl: string
  reason: string
}): Promise<{ ok: true; init_point: string; id: string } | { ok: false; error: string; raw?: unknown }> {
  const token = getMercadoPagoAccessToken()
  if (!token) return { ok: false, error: "Falta MERCADOPAGO_ACCESS_TOKEN" }

  /**
   * Sin `preapproval_plan_id`: suscripción sin plan asociado + `pending` → `init_point` (redirect a MP).
   * Con `preapproval_plan_id`, la API suele exigir `card_token_id` + `authorized` (Bricks en tu sitio).
   * @see https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/subscription-no-associated-plan
   */
  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      back_url: input.backUrl,
      status: "pending",
      auto_recurring: getAutoRecurringForPlan(input.planKey),
    }),
  })

  const data = (await res.json().catch(() => ({}))) as MpPreapprovalResponse

  if (!res.ok) {
    const msg =
      typeof data.message === "string"
        ? data.message
        : `Mercado Pago ${res.status}`
    return { ok: false, error: msg, raw: data }
  }

  const initPoint = data.init_point
  const id = data.id
  if (!initPoint || !id) {
    return {
      ok: false,
      error: "Respuesta de Mercado Pago sin init_point o id",
      raw: data,
    }
  }

  return { ok: true, init_point: initPoint, id }
}

export async function getPreapproval(id: string): Promise<
  | {
      ok: true
      id: string
      status: string
      external_reference: string | null
    }
  | { ok: false; error: string; statusCode: number }
> {
  const token = getMercadoPagoAccessToken()
  if (!token) return { ok: false, error: "Missing token", statusCode: 500 }

  const res = await fetch(`${MP_API}/preapproval/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  const data = (await res.json().catch(() => ({}))) as MpPreapprovalResponse

  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.message === "string" ? data.message : `HTTP ${res.status}`,
      statusCode: res.status,
    }
  }

  if (!data.id || !data.status) {
    return { ok: false, error: "Respuesta inválida", statusCode: 502 }
  }

  return {
    ok: true,
    id: data.id,
    status: data.status,
    external_reference: data.external_reference ?? null,
  }
}

/** Cobro puntual o recurrente; puede traer metadata con vínculo a preapproval. */
export async function getPayment(id: string): Promise<{
  ok: true
  metadata: Record<string, unknown> | null
  external_reference: string | null
} | { ok: false; error: string }> {
  const token = getMercadoPagoAccessToken()
  if (!token) return { ok: false, error: "Missing token" }

  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const data = (await res.json().catch(() => ({}))) as {
    metadata?: Record<string, unknown>
    external_reference?: string | null
    message?: string
  }

  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.message === "string" ? data.message : `HTTP ${res.status}`,
    }
  }

  return {
    ok: true,
    metadata: data.metadata ?? null,
    external_reference: data.external_reference ?? null,
  }
}
