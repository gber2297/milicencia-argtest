/** Estimación de duración de voz para timing (sin TTS real). */

import type { SceneType } from "@/types/studio"

const MIN_CHARS_PER_SECOND = 12
const MAX_CHARS_PER_SECOND = 18

export function estimateSpeechDurationSeconds(text: string, voiceSpeed: number): number {
  const trimmed = text.trim()
  if (!trimmed) return 0.4
  const len = trimmed.length
  const baseCps = (MIN_CHARS_PER_SECOND + MAX_CHARS_PER_SECOND) / 2
  const seconds = len / baseCps / Math.max(0.5, voiceSpeed)
  return Math.min(18, Math.max(0.6, seconds))
}

export function convertSecondsToFrames(seconds: number, fps: number): number {
  return Math.max(1, Math.round(seconds * fps))
}

export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps
}

/** Roles para duraciones tipo viral (lectura cómoda en móvil). */
export type ViralSceneRole =
  | "hook"
  | "question"
  | "options"
  | "pause"
  | "reveal"
  | "explanation"
  | "cta"
  | "final_card"
  | "screenshot_focus"

/**
 * Más segundos por escena (quiz y resto): ritmo más pausado, legible en vertical.
 * Máximos evitan que una sola escena (ej. explanation) se coma todo el video.
 */
const VIRAL_CAPS: Record<ViralSceneRole, [number, number]> = {
  hook: [54, 78],
  question: [84, 126],
  options: [66, 96],
  pause: [54, 78],
  reveal: [72, 102],
  explanation: [66, 96],
  cta: [54, 78],
  final_card: [72, 96],
  screenshot_focus: [105, 135],
}

const SCENE_TYPE_TO_ROLE = {
  hook: "hook",
  question: "question",
  options: "options",
  pause: "pause",
  reveal: "reveal",
  explanation: "explanation",
  cta: "cta",
  final_card: "final_card",
  screenshot_focus: "screenshot_focus",
} as const satisfies Record<SceneType, ViralSceneRole>

export function maxFramesForSceneType(type: SceneType): number {
  const role = SCENE_TYPE_TO_ROLE[type]
  return VIRAL_CAPS[role][1]
}

export function minFramesForSceneType(type: SceneType): number {
  const role = SCENE_TYPE_TO_ROLE[type]
  return VIRAL_CAPS[role][0]
}

/**
 * Duración en frames acotada por rol: lectura cómoda en formato corto/largo.
 */
export function framesForViralRole(
  role: ViralSceneRole,
  voice: string,
  voiceSpeed: number,
  fps: number,
): number {
  const est = estimateSpeechDurationSeconds(voice, voiceSpeed)
  const f = convertSecondsToFrames(est, fps)
  const [min, max] = VIRAL_CAPS[role]
  return Math.min(max, Math.max(min, f))
}
