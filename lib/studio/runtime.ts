import type { StudioScene, VideoRuntime } from "@/types/studio"
import { calculateTotalFrames } from "@/lib/studio/validation"
import { convertSecondsToFrames, estimateSpeechDurationSeconds, maxFramesForSceneType } from "@/lib/studio/timing"

export function defaultBranding(partial?: Partial<VideoRuntime["branding"]>): VideoRuntime["branding"] {
  return {
    appName: partial?.appName ?? "MiLicencia 🇦🇷",
    logoUrl: partial?.logoUrl ?? "/logo.png",
    primaryColor: partial?.primaryColor ?? "#2563eb",
    secondaryColor: partial?.secondaryColor ?? "#0f172a",
    accentColor: partial?.accentColor ?? "#22c55e",
    fontFamily: partial?.fontFamily ?? "Inter, system-ui, sans-serif",
  }
}

export function defaultCta(text?: string): VideoRuntime["cta"] {
  return {
    text: text ?? "Practicá en la app",
    variant: "primary",
  }
}

export function defaultFinalCard(partial?: Partial<VideoRuntime["finalCard"]>): VideoRuntime["finalCard"] {
  return {
    type: partial?.type ?? "image",
    title: partial?.title ?? "Pasá el teórico más rápido",
    subtitle: partial?.subtitle ?? "Simulacros ilimitados · practicá hoy",
    backgroundUrl: partial?.backgroundUrl ?? "",
  }
}

export function cloneRuntime(runtime: VideoRuntime): VideoRuntime {
  return JSON.parse(JSON.stringify(runtime)) as VideoRuntime
}

/** Ajusta durationInFrames según voiceText y fps. */
export function applyVoiceTimingToScenes(runtime: VideoRuntime): VideoRuntime {
  const next = cloneRuntime(runtime)
  const { fps, voiceSpeed } = next
  next.scenes = next.scenes.map((scene) => {
    const text = scene.voiceText ?? scene.text ?? ""
    const est = estimateSpeechDurationSeconds(text, voiceSpeed)
    const frames = convertSecondsToFrames(est, fps)
    const padded = Math.max(scene.durationInFrames, frames)
    const capped = Math.min(padded, maxFramesForSceneType(scene.type))
    return {
      ...scene,
      durationInFrames: capped,
      estimatedSpeechSeconds: est,
    }
  })
  return next
}

export function normalizeSceneDurations(runtime: VideoRuntime, minFrames = 24): VideoRuntime {
  const next = cloneRuntime(runtime)
  next.scenes = next.scenes.map((s) => ({
    ...s,
    durationInFrames: Math.max(minFrames, Math.round(s.durationInFrames)),
  }))
  return next
}

export function mergeScenePatch(runtime: VideoRuntime, sceneId: string, patch: Partial<StudioScene>): VideoRuntime {
  const scenes = runtime.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s))
  return { ...runtime, scenes }
}

export function runtimeTotalFrames(runtime: VideoRuntime): number {
  return calculateTotalFrames(runtime.scenes)
}

/** Encaja el video en un máximo de segundos (útil tras timing por voz). */
export function clampRuntimeToMaxSeconds(runtime: VideoRuntime, maxSeconds: number): VideoRuntime {
  const maxFrames = Math.round(maxSeconds * runtime.fps)
  const total = calculateTotalFrames(runtime.scenes)
  if (total <= maxFrames) return cloneRuntime(runtime)
  const scale = maxFrames / total
  const next = cloneRuntime(runtime)
  next.scenes = next.scenes.map((s) => ({
    ...s,
    durationInFrames: Math.max(18, Math.round(s.durationInFrames * scale)),
  }))
  return next
}
