import { NextResponse } from "next/server"

import { getMercadoPagoAccessToken, type MercadoPagoPlanKey } from "@/lib/mercadopago/config"
import { createPendingPreapproval } from "@/lib/mercadopago/preapproval"
import { getMercadoPagoBackUrl } from "@/lib/mercadopago/back-url"
import { getPublicOrigin } from "@/lib/public-url"
import { createClient } from "@/lib/supabase/server"

function parsePlan(raw: unknown): MercadoPagoPlanKey | null {
  if (raw === "weekly" || raw === "monthly") return raw
  return null
}

export async function POST(request: Request) {
  try {
    return await postMpSubscribe(request)
  } catch (e) {
    console.error("[mp-subscribe] unhandled", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error interno al iniciar el checkout" },
      { status: 500 },
    )
  }
}

async function postMpSubscribe(request: Request) {
  const token = getMercadoPagoAccessToken()
  if (!token) {
    return NextResponse.json(
      { error: "Mercado Pago no configurado (MERCADOPAGO_ACCESS_TOKEN)" },
      { status: 503 },
    )
  }

  let plan: MercadoPagoPlanKey | null = null
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { plan?: string }
    plan = parsePlan(body.plan)
  } else {
    const fd = await request.formData()
    plan = parsePlan(fd.get("plan"))
  }

  if (!plan) {
    return NextResponse.json({ error: "plan inválido (weekly | monthly)" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    const login = new URL("/login", getPublicOrigin(request))
    login.searchParams.set("redirect", "/pricing")
    return NextResponse.redirect(login)
  }

  let backUrl: string
  try {
    backUrl = getMercadoPagoBackUrl(request)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "back_url inválido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const reason =
    plan === "weekly" ? "Mi Licencia — plan semanal" : "Mi Licencia — plan mensual"

  const created = await createPendingPreapproval({
    planKey: plan,
    payerEmail: user.email,
    externalReference: user.id,
    backUrl,
    reason,
  })

  if (!created.ok) {
    return NextResponse.json(
      { error: created.error, details: created.raw },
      { status: 502 },
    )
  }

  let redirectTo: string
  try {
    redirectTo = new URL(created.init_point).href
  } catch {
    return NextResponse.json({ error: "init_point de Mercado Pago inválido" }, { status: 502 })
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      mercadopago_preapproval_id: created.id,
      mercadopago_plan_key: plan,
    })
    .eq("user_id", user.id)
  if (error) console.error("[mp-subscribe] subscriptions update", error)

  return NextResponse.redirect(redirectTo, 302)
}
