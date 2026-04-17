/** Rutas públicas (desde `public/`) para MP3 generados por `scripts/generate-audio-assets.ts`. */

export const VOICE_SEGMENT_COUNT = 5

/** Nombres de archivo fijos: voice-0.mp3 … voice-4.mp3 */
export const VOICE_SEGMENT_FILENAMES = Array.from({ length: VOICE_SEGMENT_COUNT }, (_, i) => `voice-${i}.mp3`)

export const VOICE_CTA_FILENAME = "voice-cta.mp3"

export const VOICE_MUSIC_FILENAME = "music.wav"

/** Voz Edge TTS */
export const EDGE_TTS_VOICE = "es-ES-ElviraNeural"

export const EDGE_TTS_RATE = "+0%"

export const EDGE_TTS_VOLUME = "+10%"

/** Reproducción en Remotion: 1 = duración natural del MP3 en timeline. */
export const DEFAULT_VOICE_PLAYBACK_RATE = 1

/** Carpeta bajo `public/` */
export const PUBLIC_AUDIO_DIR = "audio"
