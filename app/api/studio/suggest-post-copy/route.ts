import { NextResponse } from "next/server"
import { z } from "zod"

import { fallbackPostCopy, suggestPostCopyWithOpenAI } from "@/lib/studio/suggest-post-copy-ai"
import { videoRuntimeSchema } from "@/types/studio"

const bodySchema = z.object({
  channel: z.enum(["tiktok", "reels", "shorts"]),
  runtime: z.unknown().optional(),
  summary: z.string().optional(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { channel, summary } = parsed.data
  const runtimeParsed = parsed.data.runtime != null ? videoRuntimeSchema.safeParse(parsed.data.runtime) : null
  const runtime = runtimeParsed?.success ? runtimeParsed.data : null

  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim())

  if (hasKey) {
    try {
      const { copy, hashtags } = await suggestPostCopyWithOpenAI({
        channel,
        runtime,
        summary,
      })
      return NextResponse.json({ copy, hashtags, source: "openai" as const })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error OpenAI"
      const fb = fallbackPostCopy({ channel, summary })
      return NextResponse.json({
        copy: fb.copy,
        hashtags: fb.hashtags,
        source: "fallback" as const,
        warning: msg,
      })
    }
  }

  const fb = fallbackPostCopy({ channel, summary })
  return NextResponse.json({ copy: fb.copy, hashtags: fb.hashtags, source: "fallback" as const })
}
