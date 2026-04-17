import { calculateTotalFrames } from "@/lib/studio/validation"
import type { StudioScene, VideoRuntime } from "@/types/studio"

/**
 * Paso C (Remotion): con `voiceSegmentFrames` + `ctaVoiceFrames` medidos, cada `Sequence` usa esos frames
 * y el mismo `voicePlaybackRate` que al calcular (`VideoComposition`). Sin medidas: `scene.durationInFrames`;
 * placeholder fijo: `PLACEHOLDER_SCENE_FRAMES` en `@/lib/studio/video-config`.
 */

export interface SceneTimelineEntry {
  scene: StudioScene
  sceneIndex: number
  from: number
  durationInFrames: number
}

function useNarrativeFourSync(runtime: VideoRuntime): boolean {
  return (
    runtime.meta?.audioLayout === "narrative_four" &&
    Array.isArray(runtime.audio?.voiceSegmentFrames) &&
    runtime.audio!.voiceSegmentFrames!.length >= 4
  )
}

function useClassicSegmentSync(runtime: VideoRuntime): boolean {
  if (runtime.meta?.audioLayout === "narrative_four") return false
  const a = runtime.audio
  const vf = a?.voiceSegmentFrames
  const ctaF = a?.ctaVoiceFrames
  return (
    Array.isArray(vf) &&
    vf.length >= 1 &&
    typeof ctaF === "number" &&
    ctaF > 0
  )
}

/** Construye timeline con duraciones sincronizadas a voz si `audio` trae frames. */
export function buildSceneTimeline(runtime: VideoRuntime): SceneTimelineEntry[] {
  const { scenes, audio } = runtime
  const vf = audio?.voiceSegmentFrames
  const ctaF = audio?.ctaVoiceFrames
  const narrative = useNarrativeFourSync(runtime)
  const classic = useClassicSegmentSync(runtime)

  let from = 0
  let ctaApplied = false

  return scenes.map((scene, sceneIndex) => {
    let durationInFrames = scene.durationInFrames

    if (narrative && vf && sceneIndex < vf.length) {
      durationInFrames = vf[sceneIndex]!
    } else if (classic && vf) {
      if (sceneIndex < 5 && sceneIndex < vf.length) durationInFrames = vf[sceneIndex]!
      else if (scene.type === "cta" && !ctaApplied && typeof ctaF === "number") {
        durationInFrames = ctaF
        ctaApplied = true
      }
    }

    const entry: SceneTimelineEntry = {
      scene,
      sceneIndex,
      from,
      durationInFrames,
    }
    from += durationInFrames
    return entry
  })
}

export function timelineTotalFrames(entries: SceneTimelineEntry[]): number {
  return entries.reduce((a, e) => a + e.durationInFrames, 0)
}

/** Duración total del Player (escenas vs timeline con voz). */
export function calculateCompositionDuration(runtime: VideoRuntime): number {
  const entries = buildSceneTimeline(runtime)
  const timeline = timelineTotalFrames(entries)
  const a = runtime.audio
  const hasNarrativeSync =
    runtime.meta?.audioLayout === "narrative_four" &&
    Array.isArray(a?.voiceSegmentFrames) &&
    a!.voiceSegmentFrames!.length >= 4

  const hasClassicSync =
    runtime.meta?.audioLayout !== "narrative_four" &&
    Array.isArray(a?.voiceSegmentFrames) &&
    a!.voiceSegmentFrames!.length >= 1 &&
    typeof a?.ctaVoiceFrames === "number" &&
    a.ctaVoiceFrames > 0

  if (hasNarrativeSync || hasClassicSync) return Math.max(1, timeline)

  return Math.max(1, timeline, calculateTotalFrames(runtime.scenes))
}

/** Índice de escena activa en `frame` según el mismo timeline que el Player. */
export function frameToSceneIndexFromTimeline(runtime: VideoRuntime, frame: number): number {
  const entries = buildSceneTimeline(runtime)
  const total = timelineTotalFrames(entries)
  const maxF = Math.max(0, total - 1)
  const f = Math.min(Math.max(0, frame), maxF)
  let acc = 0
  for (let i = 0; i < entries.length; i++) {
    const d = entries[i].durationInFrames
    if (f < acc + d) return i
    acc += d
  }
  return Math.max(0, entries.length - 1)
}
