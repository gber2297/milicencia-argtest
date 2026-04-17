import path from "path"

const ROOT = process.cwd()

/** Runtime fusionado (guion + imágenes) para el video marketing */
export const MARKETING_RUNTIME_JSON = path.join(ROOT, "src", "data", "runtime-marketing.json")

/** Frames de voz medidos para marketing (no pisa el JSON del Studio clásico) */
export const VOICE_FRAMES_MARKETING_JSON = path.join(ROOT, "src", "data", "voice-segment-frames-marketing.json")

/** Subcarpeta bajo `public/` para MP3 marketing */
export const MARKETING_PUBLIC_AUDIO_DIR = "audio-marketing"
