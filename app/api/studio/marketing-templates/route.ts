import { NextResponse } from "next/server"

import { MARKETING_TEMPLATE_DEFINITIONS } from "@/lib/studio/marketing-templates"

export async function GET() {
  const templates = MARKETING_TEMPLATE_DEFINITIONS.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    sceneTypes: t.baseScenes.map((s) => s.type),
  }))
  return NextResponse.json({ templates })
}
