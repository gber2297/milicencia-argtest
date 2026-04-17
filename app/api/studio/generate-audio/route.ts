import { NextResponse } from "next/server"
import { z } from "zod"

import { runEdgeTtsPipeline } from "@/lib/studio/generate-audio-pipeline"
import { normalizeSceneDurations } from "@/lib/studio/runtime"
import { validateRuntime } from "@/lib/studio/validation"
import { videoRuntimeSchema } from "@/types/studio"

export const maxDuration = 300

const bodySchema = z.object({
  runtime: z.unknown(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }
  const raw = parsed.data.runtime
  const base = videoRuntimeSchema.safeParse(raw)
  if (!base.success) {
    return NextResponse.json({ error: base.error.flatten() }, { status: 400 })
  }
  let runtime = normalizeSceneDurations(base.data)
  const v = validateRuntime(runtime)
  if (!v.ok) {
    return NextResponse.json({ error: v.errors }, { status: 422 })
  }

  const tts = await runEdgeTtsPipeline(runtime)
  if (!tts.ok) {
    return NextResponse.json(
      { error: "Fallo TTS (Edge). ¿Red disponible?", detail: tts.error, log: tts.log },
      { status: 502 },
    )
  }

  const v2 = validateRuntime(tts.runtime)
  if (!v2.ok) {
    return NextResponse.json({ error: v2.errors }, { status: 422 })
  }

  return NextResponse.json({ runtime: tts.runtime, ttsLog: tts.log })
}
