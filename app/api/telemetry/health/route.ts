import { NextResponse } from "next/server"

import { tryCreateAdminClient } from "@/lib/supabase/admin"

/**
 * Diagnóstico en producción: abrí GET /api/telemetry/health en el navegador.
 * No expone secretos; indica si el servidor puede escribir en Supabase.
 */
export const runtime = "nodejs"

export async function GET() {
  const admin = tryCreateAdminClient()
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        hasServiceRole: false,
        message:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el hosting (Variables de entorno del proyecto Vercel, sin NEXT_PUBLIC).",
      },
      { status: 200 },
    )
  }

  const { error } = await admin.from("web_analytics_events").select("id").limit(1)

  if (error) {
    const missingTable =
      error.message.includes("relation") ||
      error.message.includes("does not exist") ||
      error.code === "42P01"

    return NextResponse.json(
      {
        ok: false,
        hasServiceRole: true,
        tableOk: false,
        message: error.message,
        hint: missingTable
          ? "Ejecutá supabase/migrations/004_web_analytics.sql en este proyecto de Supabase."
          : undefined,
      },
      { status: 200 },
    )
  }

  return NextResponse.json({
    ok: true,
    hasServiceRole: true,
    tableOk: true,
    message: "El servidor puede leer web_analytics_events. Los POST a /api/telemetry/event deberían insertar.",
  })
}
