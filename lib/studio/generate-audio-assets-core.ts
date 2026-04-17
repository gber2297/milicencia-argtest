import { mkdir, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"

import { EdgeTTS } from "edge-tts-universal"

import { mp3DurationToTimelineFrames } from "@/lib/studio/audio-timeline-frames"
import {
  DEFAULT_VOICE_PLAYBACK_RATE,
  EDGE_TTS_RATE,
  EDGE_TTS_VOICE,
  EDGE_TTS_VOLUME,
  VOICE_CTA_FILENAME,
  VOICE_MUSIC_FILENAME,
  VOICE_SEGMENT_COUNT,
} from "@/lib/studio/voice-constants"
import type { VideoRuntime } from "@/types/studio"

export interface RunGenerateAudioAssetsInput {
  runtimePath: string
  framesJson: string
  /** Directorio absoluto bajo `public/` (ej. `.../public/audio`) */
  publicAudio: string
}

function voiceSegmentCountForRuntime(runtime: VideoRuntime): number {
  if (runtime.meta?.audioLayout === "narrative_four")
    return Math.max(1, runtime.meta?.voiceSegmentCount ?? 4)
  return VOICE_SEGMENT_COUNT
}

function sceneLine(runtime: VideoRuntime, index: number): string {
  const s = runtime.scenes[index]
  if (!s) return "."
  const t = (s.voiceText ?? s.text ?? "").trim()
  return t || "."
}

function ctaLine(runtime: VideoRuntime): string {
  const t = (runtime.cta as { ctaVoiceText?: string }).ctaVoiceText ?? runtime.cta.text
  return (t ?? "").trim() || "Practicá en la app."
}

async function synthToMp3(text: string, outFile: string): Promise<void> {
  const tts = new EdgeTTS(text, EDGE_TTS_VOICE, {
    rate: EDGE_TTS_RATE,
    volume: EDGE_TTS_VOLUME,
  })
  const { audio } = await tts.synthesize()
  const buf = Buffer.from(await audio.arrayBuffer())
  await writeFile(outFile, buf)
}

/** WAV PCM 16-bit mono ~12s silencio (placeholder música). */
function buildSilentWavBuffer(seconds: number, sampleRate = 44100): Buffer {
  const numSamples = Math.floor(sampleRate * seconds)
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write("RIFF", 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write("WAVE", 8)
  buf.write("fmt ", 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write("data", 36)
  buf.writeUInt32LE(dataSize, 40)
  return buf
}

/**
 * Edge TTS + medición de duración (music-metadata) + `voice-segment-frames.json`.
 * Usado por la API y por `npm run studio:generate-audio` (sin subproceso).
 */
export async function runGenerateAudioAssets(input: RunGenerateAudioAssetsInput): Promise<void> {
  const { parseFile } = await import("music-metadata")

  const { runtimePath, framesJson, publicAudio } = input
  const raw = await readFile(runtimePath, "utf8")
  const runtime = JSON.parse(raw) as VideoRuntime

  const fps = runtime.fps || 30
  const voicePlaybackRate = runtime.audio?.voicePlaybackRate ?? DEFAULT_VOICE_PLAYBACK_RATE
  const segmentCount = voiceSegmentCountForRuntime(runtime)
  const narrativeFour = runtime.meta?.audioLayout === "narrative_four"

  await mkdir(publicAudio, { recursive: true })
  await mkdir(dirname(framesJson), { recursive: true })

  for (let i = 0; i < segmentCount; i++) {
    const text = sceneLine(runtime, i)
    const name = `voice-${i}.mp3`
    const out = join(publicAudio, name)
    console.log(`Sintetizando ${name}…`)
    await synthToMp3(text, out)
  }

  const ctaPath = join(publicAudio, VOICE_CTA_FILENAME)
  let ctaVoiceFrames = 0
  if (!narrativeFour) {
    console.log(`Sintetizando ${VOICE_CTA_FILENAME}…`)
    await synthToMp3(ctaLine(runtime), ctaPath)
    const ctaMeta = await parseFile(ctaPath)
    ctaVoiceFrames = mp3DurationToTimelineFrames(ctaMeta.format.duration, fps, voicePlaybackRate)
  }

  const musicPath = join(publicAudio, VOICE_MUSIC_FILENAME)
  await writeFile(musicPath, buildSilentWavBuffer(12))
  console.log(`Escrito ${VOICE_MUSIC_FILENAME} (silencio 12s).`)

  const voiceSegmentFrames: number[] = []
  for (let i = 0; i < segmentCount; i++) {
    const p = join(publicAudio, `voice-${i}.mp3`)
    const meta = await parseFile(p)
    voiceSegmentFrames.push(mp3DurationToTimelineFrames(meta.format.duration, fps, voicePlaybackRate))
  }

  const payload = {
    fps,
    voicePlaybackRate,
    voiceSegmentFrames,
    ctaVoiceFrames,
  }

  await writeFile(framesJson, JSON.stringify(payload, null, 2), "utf8")
  console.log(`Escrito ${framesJson}`)
  console.log(JSON.stringify(payload, null, 2))
}
