import { NextResponse } from "next/server"
import { z } from "zod"

import { buildMarketingVideoRuntime, saveMarketingRuntime } from "@/lib/studio/generate-marketing-runtime"
import { runEdgeTtsPipeline } from "@/lib/studio/generate-audio-pipeline"
import { MARKETING_PUBLIC_AUDIO_DIR, MARKETING_RUNTIME_JSON, VOICE_FRAMES_MARKETING_JSON } from "@/lib/studio/marketing-paths"
import { writeRemotionMarketingProps } from "@/lib/studio/marketing-remotion-props"
import { enqueueRenderJob, renderTimestamp } from "@/lib/studio/render"
import { renderVideoToOut } from "@/lib/studio/run-remotion-render-out"
import { validateRuntime } from "@/lib/studio/validation"

const bodySchema = z.object({
  templateId: z.string().min(1),
  brief: z.string(),
  channel: z.enum(["tiktok", "reels", "shorts"]),
})

export const maxDuration = 300

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    let runtime = await buildMarketingVideoRuntime(parsed.data)
    const v0 = validateRuntime(runtime)
    if (!v0.ok) {
      return NextResponse.json({ error: v0.errors }, { status: 422 })
    }
    await saveMarketingRuntime(runtime)
    await writeRemotionMarketingProps(runtime)

    const tts = await runEdgeTtsPipeline(runtime, {
      runtimeJsonPath: MARKETING_RUNTIME_JSON,
      voiceFramesJsonPath: VOICE_FRAMES_MARKETING_JSON,
      publicAudioDir: MARKETING_PUBLIC_AUDIO_DIR,
    })
    if (!tts.ok) {
      return NextResponse.json(
        {
          error: "Fallo TTS (Edge) marketing",
          detail: tts.error,
          log: tts.log,
          runtime,
          readyForRender: false,
        },
        { status: 502 },
      )
    }

    runtime = tts.runtime
    const v1 = validateRuntime(runtime)
    if (!v1.ok) {
      return NextResponse.json({ error: v1.errors }, { status: 422 })
    }
    await saveMarketingRuntime(runtime)
    await writeRemotionMarketingProps(runtime)

    const stamp = renderTimestamp()
    const remotion = await renderVideoToOut("marketing", runtime, { stamp })
    if (!remotion.ok) {
      return NextResponse.json(
        {
          error: "Fallo render Remotion (MP4 marketing)",
          detail: remotion.error,
          log: remotion.log,
          runtime,
          readyForRender: false,
        },
        { status: 500 },
      )
    }

    const render = await enqueueRenderJob(runtime, { stamp })
    const mp4Rel = `out/${remotion.outputFilename}`

    return NextResponse.json({
      runtime,
      ttsLog: tts.log,
      remotionLog: remotion.log,
      render: {
        ...render,
        mp4OutRelative: mp4Rel,
        note: `${render.note} Video: ${mp4Rel}.`,
      },
      readyForRender: true,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en pipeline marketing"
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
