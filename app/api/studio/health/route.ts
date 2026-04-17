import { NextResponse } from "next/server"

import { getRenderBusy } from "@/lib/studio/state"

export async function GET() {
  return NextResponse.json({ ok: true, busy: getRenderBusy() })
}
