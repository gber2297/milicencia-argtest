/**
 * Configuración de timeline vertical (Remotion) alineada al flujo:
 * duración_efectiva_seg = duración_mp3_seg / voicePlaybackRate → frames = ceil(efectiva * fps),
 * con piso y placeholder hasta medir TTS real.
 */
export const DEFAULT_VIDEO_FPS = 30

/** Sin `voice-segment-frames.json` desde MP3: duración por “slot” de voz (60f @ 30fps = 2s). Solo placeholder. */
export const PLACEHOLDER_SCENE_FRAMES = 60

/** Tras medir el MP3: evita segmentos ridículamente cortos. */
export const MIN_SCENE_FRAMES = 24
