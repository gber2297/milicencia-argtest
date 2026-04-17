import { NextResponse } from "next/server"
import { z } from "zod"

import { buildMarketingVideoRuntime, saveMarketingRuntime } from "@/lib/studio/generate-marketing-runtime"
import { writeRemotionMarketingProps } from "@/lib/studio/marketing-remotion-props"
import { validateRuntime } from "@/lib/studio/validation"

const bodySchema = z.object({
  templateId: z.string().min(1),
  brief: z.string(),
  channel: z.enum(["tiktok", "reels", "shorts"]),
})

export const maxDuration = 120

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const runtime = await buildMarketingVideoRuntime(parsed.data)
    const v = validateRuntime(runtime)
    if (!v.ok) {
      return NextResponse.json({ error: v.errors }, { status: 422 })
    }
    await saveMarketingRuntime(runtime)
    await writeRemotionMarketingProps(runtime)
    return NextResponse.json({ runtime, savedPath: "src/data/runtime-marketing.json" })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error generando marketing"
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
