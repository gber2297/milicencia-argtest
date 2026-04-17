import { z } from "zod"

export const VIDEO_TYPES = [
  "quiz",
  "error",
  "motivacion",
  "datos_curiosos",
  "storytelling",
  "app",
  "marketing",
] as const
export type VideoType = (typeof VIDEO_TYPES)[number]

export const CHANNELS = ["tiktok", "reels", "shorts"] as const
export type StudioChannel = (typeof CHANNELS)[number]

export const GENERATION_MODES = ["parser", "full_ai"] as const
export type GenerationMode = (typeof GENERATION_MODES)[number]

export const SCENE_TYPES = [
  "hook",
  "question",
  "options",
  "pause",
  "reveal",
  "explanation",
  "cta",
  "final_card",
  "screenshot_focus",
] as const
export type SceneType = (typeof SCENE_TYPES)[number]

export const FINAL_CARD_TYPES = ["image", "video"] as const
export type FinalCardMediaType = (typeof FINAL_CARD_TYPES)[number]

export interface SceneOption {
  id: string
  label: string
}

export interface StudioScene {
  id: string
  type: SceneType
  durationInFrames: number
  backgroundType: "gradient" | "solid" | "image"
  backgroundUrl?: string
  text?: string
  voiceText?: string
  highlightText?: string
  options?: SceneOption[]
  /** Reveal: marca la opción correcta */
  correctOptionId?: string
  /** Screenshot / app demo */
  screenshotUrl?: string
  /** Búsqueda de stock (inglés) antes de resolver `backgroundUrl`; no se valida en zod estricto del runtime completo si se strip-ea al guardar */
  imageSearchQuery?: string
  overlayQuestion?: string
  /** Screenshot: texto de respuesta correcta (highlight al final) */
  overlayAnswer?: string
  /** Metadatos TTS / timing */
  estimatedSpeechSeconds?: number
}

export interface StudioMusic {
  enabled: boolean
  url: string
}

export interface StudioBranding {
  appName: string
  /** Ruta pública del logo (ej. `/logo.png` en `public/`) */
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
}

export interface StudioCta {
  text: string
  variant: "primary" | "secondary"
  /** Texto dedicado para TTS del CTA (si no, se usa `text`) */
  ctaVoiceText?: string
}

/** Audio generado fuera de Remotion (Edge TTS + `voice-segment-frames.json`). */
export interface StudioAudioConfig {
  /** Velocidad de reproducción del MP3 en Remotion (p. ej. 1.2). */
  voicePlaybackRate: number
  /** Rutas públicas: `/audio/voice-0.mp3` … */
  voiceSegmentSrcs?: string[]
  ctaVoiceSrc?: string
  /** Un solo MP3 para todo el video (modo alternativo). */
  voiceOverSrc?: string
  musicSrc?: string
  /** Frames por segmento (alineados con las primeras escenas habladas). */
  voiceSegmentFrames?: number[]
  /** En `narrative_four` puede ser 0 (el CTA va en voice-3). */
  ctaVoiceFrames?: number
}

export interface StudioFinalCard {
  type: FinalCardMediaType
  title: string
  subtitle: string
  backgroundUrl: string
}

export interface VideoRuntime {
  videoType: VideoType
  channel: StudioChannel
  theme: string
  fps: number
  width: number
  height: number
  voiceSpeed: number
  music: StudioMusic
  branding: StudioBranding
  cta: StudioCta
  finalCard: StudioFinalCard
  scenes: StudioScene[]
  /** Voz / música sincronizada (opcional). */
  audio?: StudioAudioConfig
  /** Generación / versión */
  meta?: {
    brief?: string
    generationMode?: GenerationMode
    createdAt?: string
    /** Pregunta de `public.questions` cuando el quiz sale de la BD */
    questionId?: string
    questionSource?: "database" | "template"
    /**
     * `narrative_four`: HOOK → RETENCIÓN → CONTENIDO → CTA con 4 MP3 (voice-0…3), sin voice-cta;
     * final_card sin voz. Resto: flujo clásico (5 segmentos + CTA).
     */
    audioLayout?: "classic" | "narrative_four"
    /** Cantidad de archivos voice-{i}.mp3 (por defecto 5 salvo narrative_four → 4) */
    voiceSegmentCount?: number
  }
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

const sceneOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
})

export const studioSceneSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SCENE_TYPES),
  durationInFrames: z.number().int().positive(),
  backgroundType: z.enum(["gradient", "solid", "image"]),
  backgroundUrl: z.string().optional(),
  text: z.string().optional(),
  voiceText: z.string().optional(),
  highlightText: z.string().optional(),
  options: z.array(sceneOptionSchema).optional(),
  correctOptionId: z.string().optional(),
  screenshotUrl: z.string().optional(),
  overlayQuestion: z.string().optional(),
  overlayAnswer: z.string().optional(),
  estimatedSpeechSeconds: z.number().nonnegative().optional(),
  imageSearchQuery: z.string().optional(),
})

export const videoRuntimeSchema = z.object({
  videoType: z.enum(VIDEO_TYPES),
  channel: z.enum(CHANNELS),
  theme: z.string(),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  voiceSpeed: z.number().positive(),
  music: z.object({
    enabled: z.boolean(),
    url: z.string(),
  }),
  branding: z.object({
    appName: z.string(),
    logoUrl: z.string().optional(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    fontFamily: z.string(),
  }),
  cta: z.object({
    text: z.string(),
    variant: z.enum(["primary", "secondary"]),
    ctaVoiceText: z.string().optional(),
  }),
  finalCard: z.object({
    type: z.enum(FINAL_CARD_TYPES),
    title: z.string(),
    subtitle: z.string(),
    backgroundUrl: z.string(),
  }),
  scenes: z.array(studioSceneSchema).min(1),
  meta: z
    .object({
      brief: z.string().optional(),
      generationMode: z.enum(GENERATION_MODES).optional(),
      createdAt: z.string().optional(),
      questionId: z.string().uuid().optional(),
      questionSource: z.enum(["database", "template"]).optional(),
      audioLayout: z.enum(["classic", "narrative_four"]).optional(),
      voiceSegmentCount: z.number().int().positive().optional(),
    })
    .optional(),
  audio: z
    .object({
      voicePlaybackRate: z.number().positive(),
      voiceSegmentSrcs: z.array(z.string()).optional(),
      ctaVoiceSrc: z.string().optional(),
      voiceOverSrc: z.string().optional(),
      musicSrc: z.string().optional(),
      voiceSegmentFrames: z.array(z.number().int().positive()).optional(),
      ctaVoiceFrames: z.number().int().nonnegative().optional(),
    })
    .optional(),
})

export type VideoRuntimeInput = z.infer<typeof videoRuntimeSchema>
