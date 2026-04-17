import { NextResponse } from "next/server"

import { STUDIO_TEMPLATE_DEFINITIONS } from "@/lib/studio/templates"

export async function GET() {
  return NextResponse.json({ templates: STUDIO_TEMPLATE_DEFINITIONS })
}
