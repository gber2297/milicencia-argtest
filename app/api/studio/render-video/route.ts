import { NextResponse } from "next/server"
import { z } from "zod"

import { enqueueRenderJob } from "@/lib/studio/render"
import { videoRuntimeSchema } from "@/types/studio"

const bodySchema = z.object({
  runtime: z.unknown(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }
  const base = videoRuntimeSchema.safeParse(parsed.data.runtime)
  if (!base.success) {
    return NextResponse.json({ error: base.error.flatten() }, { status: 400 })
  }
  const result = await enqueueRenderJob(base.data as Parameters<typeof enqueueRenderJob>[0])
  return NextResponse.json({
    ok: result.ok,
    jobId: result.jobId,
    outputPath: result.outputPublicPath,
    publicPath: result.outputPublicPath,
    sidecarFilename: result.outputFilename,
    note: `${result.note} Para MP4 usá «Generar todo» o Remotion CLI → out/studio-*.mp4.`,
  })
}
