import { NextResponse } from "next/server"

/** La práctica requiere cuenta con suscripción activa. */
export async function POST() {
  return NextResponse.json(
    { error: "Se requiere suscripción activa", code: "SUBSCRIPTION_REQUIRED" as const },
    { status: 403 },
  )
}
