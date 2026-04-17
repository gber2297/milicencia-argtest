/**
 * Sube un MP4 local a Blotato y opcionalmente crea un post.
 *
 * Uso:
 *   npx tsx scripts/blotato-upload.ts --file=out/studio-20260416-120000.mp4 --caption="..." --platform=tiktok
 */

import { readFile } from "fs/promises"
import { join } from "path"

import { uploadLocalMp4ToBlotato } from "../lib/studio/blotato"

function parseArgs() {
  const a = process.argv.slice(2)
  const get = (k: string) => {
    const i = a.indexOf(k)
    return i >= 0 ? a[i + 1] : undefined
  }
  return {
    file: get("--file") ?? join(process.cwd(), "out", "studio-video.mp4"),
    caption: get("--caption") ?? "Video MiLicencia 🇦🇷",
    platform: get("--platform") ?? "tiktok",
  }
}

async function main() {
  const { file, caption, platform } = parseArgs()
  const result = await uploadLocalMp4ToBlotato({
    filePath: file,
    caption,
    platform,
    readFile: (p) => readFile(p),
  })
  console.log(JSON.stringify(result, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
