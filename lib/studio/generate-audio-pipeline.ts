import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"

import { runGenerateAudioAssets } from "@/lib/studio/generate-audio-assets-core"
import {
  attachVoiceAudioFromFrames,
  parseVoiceSegmentFramesFile,
  applyVoiceSegmentDurationsToScenes,
} from "@/lib/studio/merge-voice-frames"
import { PUBLIC_AUDIO_DIR } from "@/lib/studio/voice-constants"
import type { VideoRuntime } from "@/types/studio"

const ROOT = process.cwd()
export const STUDIO_RUNTIME_JSON = path.join(ROOT, "data", "studio-runtime.json")
const VOICE_FRAMES_JSON = path.join(ROOT, "src", "data", "voice-segment-frames.json")

export interface EdgeTtsPipelineOptions {
  /** Dónde escribir el runtime antes de generar audio */
  runtimeJsonPath?: string
  /** JSON de frames generado por el script (lectura tras TTS) */
  voiceFramesJsonPath?: string
  /** Subcarpeta bajo `public/` para los MP3 (ej. `audio-marketing`) */
  publicAudioDir?: string
}

export interface GenerateAudioPipelineOk {
  ok: true
  runtime: VideoRuntime
  log: string
}

export interface GenerateAudioPipelineErr {
  ok: false
  error: string
  log: string
}

/** Escribe runtime, genera MP3 + frames (Edge TTS + music-metadata) en proceso, fusiona audio al runtime. */
export async function runEdgeTtsPipeline(
  runtime: VideoRuntime,
  opts?: EdgeTtsPipelineOptions,
): Promise<GenerateAudioPipelineOk | GenerateAudioPipelineErr> {
  let log = ""
  try {
    const runtimePath = opts?.runtimeJsonPath ?? STUDIO_RUNTIME_JSON
    const framesReadPath = opts?.voiceFramesJsonPath ?? VOICE_FRAMES_JSON
    const publicAudioDir = opts?.publicAudioDir ?? PUBLIC_AUDIO_DIR

    await mkdir(path.dirname(runtimePath), { recursive: true })
    await writeFile(runtimePath, JSON.stringify(runtime, null, 2), "utf8")

    const publicAudioAbs = path.join(ROOT, "public", publicAudioDir)
    await runGenerateAudioAssets({
      runtimePath,
      framesJson: framesReadPath,
      publicAudio: publicAudioAbs,
    })
    log = "runGenerateAudioAssets ok"

    const raw = await readFile(framesReadPath, "utf8")
    const framesParsed = parseVoiceSegmentFramesFile(JSON.parse(raw))
    if (!framesParsed.success) {
      return {
        ok: false,
        error: `voice-segment-frames.json inválido: ${framesParsed.error}`,
        log,
      }
    }

    let next = attachVoiceAudioFromFrames(runtime, framesParsed.data, {
      publicAudioDir,
    })
    next = applyVoiceSegmentDurationsToScenes(next)
    return { ok: true, runtime: next, log }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const ex = e as { stderr?: string; stdout?: string }
    const extra = [ex.stderr, ex.stdout].filter(Boolean).join("\n")
    return {
      ok: false,
      error: extra ? `${msg}\n${extra}` : msg,
      log,
    }
  }
}
