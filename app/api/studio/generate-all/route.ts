import { NextResponse } from "next/server"
import { z } from "zod"

import { buildVideoRuntimeForStudio } from "@/lib/studio/build-studio-runtime"
import { runEdgeTtsPipeline } from "@/lib/studio/generate-audio-pipeline"
import { enqueueRenderJob, renderTimestamp } from "@/lib/studio/render"
import { normalizeSceneDurations } from "@/lib/studio/runtime"
import { renderVideoToOut } from "@/lib/studio/run-remotion-render-out"
import { validateRuntime } from "@/lib/studio/validation"

export const maxDuration = 300

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

  const v0 = validateRuntime(runtime)
  if (!v0.ok) {
    return NextResponse.json({ error: v0.errors }, { status: 422 })
  }

  const tts = await runEdgeTtsPipeline(runtime)
  if (!tts.ok) {
    return NextResponse.json(
      {
        error: "Fallo TTS (Edge). ¿Red disponible?",
        detail: tts.error,
        log: tts.log,
        runtime,
        readyForRender: false,
      },
      { status: 502 },
    )
  }

  const v1 = validateRuntime(tts.runtime)
  if (!v1.ok) {
    return NextResponse.json({ error: v1.errors }, { status: 422 })
  }

  const stamp = renderTimestamp()
  const remotion = await renderVideoToOut("studio", tts.runtime, { stamp })
  if (!remotion.ok) {
    return NextResponse.json(
      {
        error: "Fallo render Remotion (MP4)",
        detail: remotion.error,
        log: remotion.log,
        runtime: tts.runtime,
        readyForRender: false,
      },
      { status: 500 },
    )
  }

  const render = await enqueueRenderJob(tts.runtime, { stamp })
  const mp4Rel = `out/${remotion.outputFilename}`

  return NextResponse.json({
    runtime: tts.runtime,
    readyForRender: render.ok,
    ttsLog: tts.log,
    remotionLog: remotion.log,
    render: {
      ok: render.ok,
      jobId: render.jobId,
      mp4OutRelative: mp4Rel,
      publicPath: render.outputPublicPath,
      sidecarFilename: render.outputFilename,
      note: `${render.note} Video: ${mp4Rel}.`,
    },
  })
}
