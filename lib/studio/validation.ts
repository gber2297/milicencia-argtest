import type { StudioScene, ValidationResult, VideoRuntime } from "@/types/studio"
import { SCENE_TYPES, videoRuntimeSchema } from "@/types/studio"

export function validateRuntime(data: unknown): ValidationResult {
  const parsed = videoRuntimeSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    return { ok: false, errors }
  }
  const runtime = parsed.data as VideoRuntime
  const semantic = validateSemantic(runtime)
  if (!semantic.ok) return semantic
  return { ok: true, errors: [] }
}

function validateSemantic(runtime: VideoRuntime): ValidationResult {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const s of runtime.scenes) {
    if (ids.has(s.id)) errors.push(`id duplicado: ${s.id}`)
    ids.add(s.id)
  }
  for (const s of runtime.scenes) {
    if (s.type === "options" || s.type === "reveal") {
      if (!s.options?.length) errors.push(`${s.id}: options requiere opciones`)
    }
    if (s.type === "reveal" && s.correctOptionId) {
      const ok = s.options?.some((o) => o.id === s.correctOptionId)
      if (!ok) errors.push(`${s.id}: correctOptionId no coincide con opciones`)
    }
  }
  return { ok: errors.length === 0, errors }
}

export function calculateTotalFrames(scenes: StudioScene[]): number {
  return scenes.reduce((a, s) => a + s.durationInFrames, 0)
}

export function isSceneType(x: string): x is (typeof SCENE_TYPES)[number] {
  return (SCENE_TYPES as readonly string[]).includes(x)
}
