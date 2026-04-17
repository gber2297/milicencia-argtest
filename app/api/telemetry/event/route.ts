import { NextResponse } from "next/server"
import { z } from "zod"

import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Tracking propio → Supabase.
 * Ruta bajo `/api/telemetry/*` (no `/api/analytics/*`) para que uBlock / AdGuard no bloqueen la petición.
 */
export const runtime = "nodejs"

/** Evita que `getUser()` bloquee el handler en serverless si cookies/auth fallan. */
const AUTH_MS = 1800

const bodySchema = z.object({
  event: z.string().min(1).max(96).trim(),
  path: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().min(8).max(80).optional(),
})

const MAX_PROPS_JSON = 12_000

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

async function getOptionalUserId(): Promise<string | null> {
  const task = (async () => {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user?.id ?? null
    } catch {
      return null
    }
  })()
  return await Promise.race([task, sleep(AUTH_MS).then(() => null)])
}

export async function POST(req: Request) {
  try {
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

    let props: Record<string, unknown> = parsed.data.props ?? {}
    try {
      props = JSON.parse(JSON.stringify(props)) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: "props no serializable" }, { status: 400 })
    }

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
        hint: "Definí SUPABASE_SERVICE_ROLE_KEY en Vercel (Settings → Environment Variables, sin NEXT_PUBLIC). Sin comillas alrededor del valor.",
      })
    }

    const userId = await getOptionalUserId()

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
      console.error("[telemetry/event]", error.code, error.message, error.details)
      const missingTable =
        error.message.includes("relation") ||
        error.message.includes("does not exist") ||
        error.code === "42P01"

      return NextResponse.json(
        {
          ok: false,
          accepted: false,
          reason: "insert_failed" as const,
          detail: error.message,
          code: error.code,
          hint: missingTable
            ? "Ejecutá supabase/migrations/004_web_analytics.sql en el proyecto Supabase que usa NEXT_PUBLIC_SUPABASE_URL."
            : error.message.includes("JWT") || error.message.includes("Invalid API key")
              ? "Revisá que SUPABASE_SERVICE_ROLE_KEY sea la service_role del mismo proyecto que la URL."
              : undefined,
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ ok: true, accepted: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[telemetry/event] unhandled", msg)
    return NextResponse.json(
      { ok: false, accepted: false, reason: "server_error" as const, detail: msg },
      { status: 500 },
    )
  }
}
