import { readFile } from "fs/promises"

import { NextResponse } from "next/server"
import { z } from "zod"

import { runEdgeTtsPipeline } from "@/lib/studio/generate-audio-pipeline"
import {
  MARKETING_PUBLIC_AUDIO_DIR,
  MARKETING_RUNTIME_JSON,
  VOICE_FRAMES_MARKETING_JSON,
} from "@/lib/studio/marketing-paths"
import { renderTimestamp } from "@/lib/studio/render"
import { resolveLatestOutMp4 } from "@/lib/studio/resolve-out-mp4"
import { renderVideoToOut } from "@/lib/studio/run-remotion-render-out"
import { fallbackPostCopy, suggestPostCopyWithOpenAI } from "@/lib/studio/suggest-post-copy-ai"
import { uploadLocalMp4ToBlotato } from "@/lib/studio/blotato"
import { normalizeSceneDurations } from "@/lib/studio/runtime"
import { validateRuntime } from "@/lib/studio/validation"
import { type VideoRuntime, videoRuntimeSchema } from "@/types/studio"

export const maxDuration = 300

const bodySchema = z.object({
  caption: z.string().optional(),
  platform: z.string().min(1),
  videoType: z.enum(["studio", "marketing"]).optional(),
  /** Preparar: copy (si falta), TTS + Remotion si falta el MP4, luego subir */
  prepare: z.boolean().optional(),
  runtime: z.unknown().optional(),
  brief: z.string().optional(),
})

async function resolveCaption(input: {
  caption: string | undefined
  brief: string | undefined
  runtime: VideoRuntime
}): Promise<string> {
  const trimmed = input.caption?.trim()
  if (trimmed) return trimmed
  try {
    if (process.env.OPENAI_API_KEY?.trim()) {
      const { copy } = await suggestPostCopyWithOpenAI({
        channel: "tiktok",
        runtime: input.runtime,
        summary: input.brief,
      })
      return copy
    }
  } catch {
    /* fallback */
  }
  return fallbackPostCopy({ channel: "tiktok", summary: input.brief }).copy
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { platform, videoType = "studio", prepare, brief } = parsed.data
  const outKind = videoType === "marketing" ? "marketing" : "studio"
  const steps: string[] = []

  if (prepare) {
    if (parsed.data.runtime === undefined || parsed.data.runtime === null) {
      return NextResponse.json(
        { error: "Con prepare=true enviá el runtime actual del studio (JSON).", code: "RUNTIME_REQUIRED" },
        { status: 400 },
      )
    }
    const base = videoRuntimeSchema.safeParse(parsed.data.runtime)
    if (!base.success) {
      return NextResponse.json({ error: base.error.flatten() }, { status: 400 })
    }
    const runtime = normalizeSceneDurations(base.data)
    const v0 = validateRuntime(runtime)
    if (!v0.ok) {
      return NextResponse.json({ error: v0.errors }, { status: 422 })
    }

    const caption = await resolveCaption({
      caption: parsed.data.caption,
      brief,
      runtime,
    })
    steps.push(caption === parsed.data.caption?.trim() ? "caption_usuario" : "caption_generada")

    let filePath = await resolveLatestOutMp4(outKind)
    const needRender = filePath === null
    if (!needRender) steps.push("mp4_ya_existía")

    if (needRender) {
      const ttsOpts =
        videoType === "marketing"
          ? {
              runtimeJsonPath: MARKETING_RUNTIME_JSON,
              voiceFramesJsonPath: VOICE_FRAMES_MARKETING_JSON,
              publicAudioDir: MARKETING_PUBLIC_AUDIO_DIR,
            }
          : undefined

      const tts = await runEdgeTtsPipeline(runtime, ttsOpts)
      if (!tts.ok) {
        return NextResponse.json(
          { error: "Fallo TTS antes del render", detail: tts.error, log: tts.log, steps },
          { status: 502 },
        )
      }
      steps.push("tts_ok")

      const v1 = validateRuntime(tts.runtime)
      if (!v1.ok) {
        return NextResponse.json({ error: v1.errors, steps }, { status: 422 })
      }

      const stamp = renderTimestamp()
      const rendered = await renderVideoToOut(videoType === "marketing" ? "marketing" : "studio", tts.runtime, {
        stamp,
      })
      if (!rendered.ok) {
        return NextResponse.json(
          { error: "Render Remotion falló", detail: rendered.error, log: rendered.log, steps },
          { status: 500 },
        )
      }
      steps.push("remotion_ok")
      filePath = rendered.outputAbsolutePath

      try {
        await readFile(filePath)
      } catch {
        return NextResponse.json(
          {
            error: `No se generó el MP4 en out/. Revisá el log de Remotion.`,
            log: rendered.log,
            steps,
            code: "RENDER_OUTPUT_MISSING",
          },
          { status: 500 },
        )
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { error: "No hay MP4 en out/ para subir. Ejecutá render o prepare con TTS.", code: "MISSING_RENDER_OUTPUT", steps },
        { status: 422 },
      )
    }

    try {
      if (!process.env.BLOTATO_API_KEY?.trim()) {
        return NextResponse.json(
          {
            error:
              "Falta BLOTATO_API_KEY en el entorno (.env.local). Sin la clave de Blotato no se puede subir el video.",
            code: "BLOTATO_KEY_MISSING",
            caption,
            steps,
          },
          { status: 503 },
        )
      }
      const result = await uploadLocalMp4ToBlotato({
        filePath,
        caption,
        platform,
        readFile,
      })
      steps.push("blotato_ok")
      return NextResponse.json({ ok: true, caption, prepared: true, steps, ...result })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error Blotato"
      console.error("[upload-blotato]", msg)
      return NextResponse.json(
        { error: msg, detail: msg, caption, steps, code: "BLOTATO_UPLOAD_FAILED" },
        { status: 500 },
      )
    }
  }

  const caption = parsed.data.caption?.trim()
  if (!caption) {
    return NextResponse.json({ error: "Falta caption (o usá prepare=true para generarlo).", code: "CAPTION_REQUIRED" }, { status: 400 })
  }

  const filePath = await resolveLatestOutMp4(outKind)
  if (!filePath) {
    return NextResponse.json(
      {
        error:
          "No hay ningún MP4 en out/ (ni con fecha ni legacy). Usá «Generar todo» o prepare=true para generar uno.",
        code: "MISSING_RENDER_OUTPUT",
      },
      { status: 422 },
    )
  }

  try {
    await readFile(filePath)
  } catch {
    return NextResponse.json(
      {
        error: `No se pudo leer el MP4 en out/.`,
        code: "MISSING_RENDER_OUTPUT",
      },
      { status: 422 },
    )
  }

  try {
    if (!process.env.BLOTATO_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error: "Falta BLOTATO_API_KEY en .env.local.",
          code: "BLOTATO_KEY_MISSING",
        },
        { status: 503 },
      )
    }
    const result = await uploadLocalMp4ToBlotato({
      filePath,
      caption,
      platform,
      readFile,
    })
    return NextResponse.json({ ok: true, caption, prepared: false, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error Blotato"
    console.error("[upload-blotato]", msg)
    return NextResponse.json({ error: msg, detail: msg, code: "BLOTATO_UPLOAD_FAILED" }, { status: 500 })
  }
}
