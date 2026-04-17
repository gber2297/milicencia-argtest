/**
 * Paso A del flujo voz: MP3 por escena (voiceText o text) + CTA; duración real vía music-metadata.
 * Paso B: escribe `src/data/voice-segment-frames.json` (5 segmentos + CTA) con la misma regla que Remotion
 * (`mp3DurationToTimelineFrames`: efectiva = mp3_seg / voicePlaybackRate → ceil × fps, mínimo y pad).
 * El guion debe estar fijo antes; regenerar audio tras cambiar texto. Edge TTS, no OpenAI.
 *
 * Uso: npx tsx scripts/generate-audio-assets.ts [--runtime=data/studio-runtime.json]
 */

import { join } from "path"

import { runGenerateAudioAssets } from "../lib/studio/generate-audio-assets-core"
import { MARKETING_RUNTIME_JSON, VOICE_FRAMES_MARKETING_JSON } from "../lib/studio/marketing-paths"
import { PUBLIC_AUDIO_DIR } from "../lib/studio/voice-constants"

const ROOT = process.cwd()
const DATA_DIR = join(ROOT, "src", "data")

function parseArgs(): { runtimePath: string } {
  const a = process.argv.slice(2)
  const i = a.indexOf("--runtime")
  const runtimePath =
    i >= 0 && a[i + 1] ? join(ROOT, a[i + 1]!) : join(ROOT, "data", "studio-runtime.json")
  return { runtimePath }
}

function pathsFromEnv() {
  const marketingCli = process.argv.includes("--marketing")
  const envRuntime = process.env.STUDIO_RUNTIME_JSON?.trim()
  const envFrames = process.env.VOICE_FRAMES_JSON?.trim()
  let publicAudioDir = process.env.PUBLIC_AUDIO_DIR?.trim() || PUBLIC_AUDIO_DIR
  const { runtimePath: argRuntime } = parseArgs()
  let runtimePath = envRuntime || argRuntime
  let framesJson = envFrames || join(DATA_DIR, "voice-segment-frames.json")
  if (marketingCli) {
    runtimePath = MARKETING_RUNTIME_JSON
    framesJson = VOICE_FRAMES_MARKETING_JSON
    publicAudioDir = "audio-marketing"
  }
  return {
    runtimePath,
    framesJson,
    publicAudio: join(ROOT, "public", publicAudioDir),
  }
}

async function main() {
  const { runtimePath, framesJson, publicAudio } = pathsFromEnv()
  await runGenerateAudioAssets({ runtimePath, framesJson, publicAudio })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
