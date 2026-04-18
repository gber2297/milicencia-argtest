import { NextResponse } from "next/server"

import { getPayment } from "@/lib/mercadopago/preapproval"
import { syncSubscriptionFromPreapprovalId } from "@/lib/mercadopago/sync-subscription"

export const dynamic = "force-dynamic"

function readIdFromMetadata(meta: Record<string, unknown> | null): string | null {
  if (!meta) return null
  const keys = ["preapproval_id", "preapprovalId", "subscription_preapproval_id"]
  for (const k of keys) {
    const v = meta[k]
    if (typeof v === "string" && v.length > 0) return v
  }
  return null
}

/** Mercado Pago envía el cuerpo en JSON y a veces datos en query (IPN legacy). */
export async function POST(request: Request) {
  const url = new URL(request.url)
  let topic =
    url.searchParams.get("topic") ||
    url.searchParams.get("type") ||
    url.searchParams.get("action")

  let resourceId =
    url.searchParams.get("data.id") || url.searchParams.get("id") || url.searchParams.get("resource")

  const rawText = await request.text()
  let body: Record<string, unknown> = {}
  if (rawText) {
    try {
      body = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      body = {}
    }
  }

  if (!topic) {
    const t = body.type ?? body.topic ?? body.action
    topic = typeof t === "string" ? t : null
  }

  if (!resourceId) {
    const data = body.data as { id?: string } | undefined
    if (typeof data?.id === "string") resourceId = data.id
    else if (typeof body.id === "string") resourceId = body.id
  }

  if (!resourceId) {
    return NextResponse.json({ ok: true, note: "no-resource-id" })
  }

  const t = (topic || "").toLowerCase()
  const action = typeof body.action === "string" ? body.action.toLowerCase() : ""

  const looksPreapproval =
    t.includes("preapproval") ||
    t.includes("subscription") ||
    action.includes("preapproval") ||
    action.includes("subscription_preapproval")

  if (looksPreapproval) {
    const r = await syncSubscriptionFromPreapprovalId(resourceId)
    if (!r.ok) console.error("[mp-webhook] preapproval sync", r.error)
    return NextResponse.json({ ok: true })
  }

  if (t.includes("payment") || action.includes("payment")) {
    const pay = await getPayment(resourceId)
    if (!pay.ok) {
      console.error("[mp-webhook] getPayment", pay.error)
      return NextResponse.json({ ok: true })
    }
    const preId = readIdFromMetadata(pay.metadata)
    if (preId) {
      const r = await syncSubscriptionFromPreapprovalId(preId)
      if (!r.ok) console.error("[mp-webhook] payment→preapproval", r.error)
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true, note: "ignored" })
}

/** Algunos chequeos de MP usan GET. */
export async function GET() {
  return NextResponse.json({ ok: true })
}
