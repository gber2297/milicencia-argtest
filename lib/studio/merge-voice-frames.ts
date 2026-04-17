import { z } from "zod"

import { cloneRuntime } from "@/lib/studio/runtime"
import {
  DEFAULT_VOICE_PLAYBACK_RATE,
  PUBLIC_AUDIO_DIR,
  VOICE_SEGMENT_FILENAMES,
} from "@/lib/studio/voice-constants"
import type { StudioAudioConfig, VideoRuntime } from "@/types/studio"

export interface VoiceSegmentFramesFile {
  fps: number
  voicePlaybackRate: number
  voiceSegmentFrames: number[]
  ctaVoiceFrames: number
}

const voiceSegmentFramesFileSchema = z.object({
  fps: z.number(),
  voicePlaybackRate: z.number(),
  voiceSegmentFrames: z.array(z.number()),
  /** En `narrative_four` puede ser 0 (sin voice-cta.mp3). */
  ctaVoiceFrames: z.number().nonnegative(),
})

export function parseVoiceSegmentFramesFile(
  raw: unknown,
): { success: true; data: VoiceSegmentFramesFile } | { success: false; error: string } {
  const r = voiceSegmentFramesFileSchema.safeParse(raw)
  if (!r.success) return { success: false, error: r.error.message }
  return { success: true, data: r.data }
}

/** Rutas públicas por defecto alineadas con `voice-constants`. */
export function defaultVoiceSegmentSrcs(): string[] {
  return VOICE_SEGMENT_FILENAMES.map((f) => `/${PUBLIC_AUDIO_DIR}/${f}`)
}

export function defaultCtaVoiceSrc(): string {
  return `/${PUBLIC_AUDIO_DIR}/voice-cta.mp3`
}

export function defaultMusicSrc(): string {
  return `/${PUBLIC_AUDIO_DIR}/music.wav`
}

function ctaSrcForDir(publicAudioDir: string): string {
  return `/${publicAudioDir}/voice-cta.mp3`
}

function musicSrcForDir(publicAudioDir: string): string {
  return `/${publicAudioDir}/music.wav`
}

/** Inyecta `runtime.audio` a partir del JSON de frames + rutas fijas. */
export function attachVoiceAudioFromFrames(
  runtime: VideoRuntime,
  data: VoiceSegmentFramesFile,
  opts?: { publicAudioDir?: string },
): VideoRuntime {
  const dir = opts?.publicAudioDir ?? PUBLIC_AUDIO_DIR
  const voicePlaybackRate = data.voicePlaybackRate || DEFAULT_VOICE_PLAYBACK_RATE
  const musicSrc = musicSrcForDir(dir)
  const n = data.voiceSegmentFrames.length
  const voiceSegmentSrcs = Array.from({ length: n }, (_, i) => `/${dir}/voice-${i}.mp3`)
  const useCtaFile = data.ctaVoiceFrames > 0
  const audio: StudioAudioConfig = {
    voicePlaybackRate,
    voiceSegmentFrames: data.voiceSegmentFrames,
    ctaVoiceFrames: data.ctaVoiceFrames,
    voiceSegmentSrcs,
    ctaVoiceSrc: useCtaFile ? ctaSrcForDir(dir) : undefined,
    musicSrc,
  }
  return {
    ...runtime,
    audio,
    music: {
      enabled: true,
      url: musicSrc,
    },
  }
}

/** Alinea `durationInFrames` con `voiceSegmentFrames` / CTA (misma lógica que `buildSceneTimeline`). */
export function applyVoiceSegmentDurationsToScenes(runtime: VideoRuntime): VideoRuntime {
  const vf = runtime.audio?.voiceSegmentFrames
  const ctaF = runtime.audio?.ctaVoiceFrames
  if (!Array.isArray(vf) || vf.length < 1) return runtime

  if (runtime.meta?.audioLayout === "narrative_four" && vf.length >= 4) {
    const next = cloneRuntime(runtime)
    next.scenes = next.scenes.map((scene, sceneIndex) => {
      if (sceneIndex < vf.length) return { ...scene, durationInFrames: vf[sceneIndex]! }
      return scene
    })
    return next
  }

  if (typeof ctaF !== "number" || ctaF < 1) return runtime

  const next = cloneRuntime(runtime)
  let ctaApplied = false
  next.scenes = next.scenes.map((scene, sceneIndex) => {
    if (sceneIndex < 5 && sceneIndex < vf.length) {
      return { ...scene, durationInFrames: vf[sceneIndex]! }
    }
    if (scene.type === "cta" && !ctaApplied) {
      ctaApplied = true
      return { ...scene, durationInFrames: ctaF }
    }
    return scene
  })
  return next
}
