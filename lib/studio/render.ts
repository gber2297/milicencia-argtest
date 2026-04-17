import { mkdir, writeFile } from "fs/promises"
import path from "path"

import type { VideoRuntime } from "@/types/studio"
import { validateRuntime } from "@/lib/studio/validation"
import { setRenderBusy } from "@/lib/studio/state"

export interface RenderVideoResult {
  ok: boolean
  outputFilename: string
  outputPublicPath: string
  absolutePath?: string
  note: string
  jobId: string
}

/** Carpeta pública servida por Next: `public/renders/` */
export function getRendersDir(): string {
  return path.join(process.cwd(), "public", "renders")
}

function slugFromType(videoType: string): string {
  return videoType
}

/** `YYYYMMDD-HHMMSS` para nombres de archivo de render (MP4 + sidecar). */
export function renderTimestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

/**
 * Placeholder de render MP4.
 * Para producción: usar `@remotion/renderer` + bundle, Remotion Lambda, o worker con CLI.
 * Este MVP escribe JSON sidecar + devuelve ruta predecible del MP4 futuro.
 */
export interface EnqueueRenderJobOptions {
  /** Si se pasa, mismo sello que el MP4 en `out/` (p. ej. `renderTimestamp()`). */
  stamp?: string
}

export async function enqueueRenderJob(
  runtime: VideoRuntime,
  options?: EnqueueRenderJobOptions,
): Promise<RenderVideoResult> {
  const v = validateRuntime(runtime)
  if (!v.ok) {
    return {
      ok: false,
      outputFilename: "",
      outputPublicPath: "",
      note: `Validación fallida: ${v.errors.join("; ")}`,
      jobId: "",
    }
  }

  const stamp = options?.stamp ?? renderTimestamp()
  const jobId = `job_${stamp}`
  setRenderBusy(true)
  try {
    const dir = getRendersDir()
    await mkdir(dir, { recursive: true })
    const base = `${slugFromType(runtime.videoType)}-${stamp}`
    const sidecarName = `${base}.runtime.json`
    const absJson = path.join(dir, sidecarName)
    await writeFile(absJson, JSON.stringify(runtime, null, 2), "utf8")

    return {
      ok: true,
      outputFilename: sidecarName,
      outputPublicPath: `/renders/${sidecarName}`,
      absolutePath: absJson,
      note: "Runtime guardado en public/renders/*.runtime.json (mismo sello de fecha que el MP4 en out/).",
      jobId,
    }
  } finally {
    setRenderBusy(false)
  }
}
