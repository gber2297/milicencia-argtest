import { MIN_SCENE_FRAMES } from "@/lib/studio/video-config"

/**
 * Misma regla que Remotion: duración_efectiva_seg = duración_mp3_seg / voicePlaybackRate;
 * frames = ceil(efectiva * fps) + pad, con piso MIN_SCENE_FRAMES.
 */
export function mp3DurationToTimelineFrames(
  durationSeconds: number | undefined,
  fps: number,
  voicePlaybackRate: number,
  padFrames = 18,
): number {
  const sec = durationSeconds && durationSeconds > 0 ? durationSeconds : 0.3
  const rate = Math.max(0.01, voicePlaybackRate)
  const timelineSec = sec / rate
  const rawFrames = timelineSec * fps
  return Math.max(MIN_SCENE_FRAMES, Math.ceil(rawFrames) + padFrames)
}
