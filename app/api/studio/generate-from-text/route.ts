import { NextResponse } from "next/server"
import { z } from "zod"

import { buildVideoRuntimeForStudio } from "@/lib/studio/build-studio-runtime"
import { normalizeSceneDurations } from "@/lib/studio/runtime"
import { validateRuntime } from "@/lib/studio/validation"

const bodySchema = z.object({
  brief: z.string(),
  contentType: z.enum([
    "quiz",
    "error",
    "motivacion",
    "datos_curiosos",
    "storytelling",
    "app",
    "marketing",
  ]),
  channel: z.enum(["tiktok", "reels", "shorts"]),
  generationMode: z.enum(["parser", "full_ai"]),
  cta: z.string().optional(),
  finalCard: z
    .object({
      type: z.enum(["image", "video"]),
      backgroundUrl: z.string().optional(),
    })
    .optional(),
  voiceSpeed: z.number().min(0.5).max(2),
  screenshotUrl: z.string().optional(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { brief, contentType, channel, generationMode, cta, voiceSpeed, screenshotUrl, finalCard } = parsed.data

  let runtime = await buildVideoRuntimeForStudio({
    brief,
    contentType,
    channel,
    generationMode,
    voiceSpeed,
    cta,
    screenshotUrl,
  })
  if (cta) runtime.cta.text = cta
  if (finalCard?.type) runtime.finalCard.type = finalCard.type
  if (finalCard?.backgroundUrl !== undefined) runtime.finalCard.backgroundUrl = finalCard.backgroundUrl

  runtime = normalizeSceneDurations(runtime)
  const v = validateRuntime(runtime)
  if (!v.ok) {
    return NextResponse.json({ error: v.errors }, { status: 422 })
  }
  return NextResponse.json({ runtime })
}
