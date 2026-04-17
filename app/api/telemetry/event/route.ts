import { NextResponse } from "next/server"
import { z } from "zod"

import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Tracking propio → Supabase.
 * Ruta bajo `/api/telemetry/*` (no `/api/analytics/*`) para que uBlock / AdGuard no bloqueen la petición.
 */
export const runtime = "nodejs"

const bodySchema = z.object({
  event: z.string().min(1).max(96).trim(),
  path: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().min(8).max(80).optional(),
})

const MAX_PROPS_JSON = 12_000

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") {
    return NextResponse.json({ ok: true, accepted: false, reason: "disabled" as const })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const props = parsed.data.props ?? {}
  try {
    const raw = JSON.stringify(props)
    if (raw.length > MAX_PROPS_JSON) {
      return NextResponse.json({ error: "props demasiado grande" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "props no serializable" }, { status: 400 })
  }

  const admin = tryCreateAdminClient()
  if (!admin) {
    return NextResponse.json({
      ok: true,
      accepted: false,
      reason: "no_service_role" as const,
      hint: "Definí SUPABASE_SERVICE_ROLE_KEY en el hosting (no es pública; solo servidor).",
    })
  }

  let userId: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    /* sin sesión */
  }

  const { error } = await admin.from("web_analytics_events").insert({
    event_name: parsed.data.event,
    path: parsed.data.path ?? null,
    referrer: parsed.data.referrer ?? null,
    props,
    session_id: parsed.data.sessionId ?? null,
    user_id: userId,
    user_agent: req.headers.get("user-agent")?.slice(0, 512) ?? null,
  })

  if (error) {
    console.error("[telemetry/event]", error.message)
    return NextResponse.json(
      {
        ok: false,
        accepted: false,
        reason: "insert_failed" as const,
        detail: error.message,
        hint:
          error.message.includes("relation") || error.message.includes("does not exist")
            ? "Ejecutá la migración 004_web_analytics.sql en este proyecto de Supabase."
            : undefined,
      },
      { status: 503 },
    )
  }

  return NextResponse.json({ ok: true, accepted: true })
}
