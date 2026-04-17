import { readdir, stat } from "fs/promises"
import path from "path"

const OUT_DIR = "out"

/** MP4 generados por el studio con fecha: `studio-YYYYMMDD-HHMMSS.mp4` */
const STUDIO_PREFIX = "studio-"
/** MP4 marketing con fecha: `marketing-YYYYMMDD-HHMMSS.mp4` */
const MARKETING_PREFIX = "marketing-"

const LEGACY_STUDIO = "studio-video.mp4"
const LEGACY_MARKETING = "app-marketing-video.mp4"

export type OutMp4VideoKind = "studio" | "marketing"

function prefixFor(kind: OutMp4VideoKind) {
  return kind === "marketing" ? MARKETING_PREFIX : STUDIO_PREFIX
}

function legacyName(kind: OutMp4VideoKind) {
  return kind === "marketing" ? LEGACY_MARKETING : LEGACY_STUDIO
}

/**
 * Resuelve la ruta absoluta al MP4 más reciente en `out/` (nombre con fecha) o al archivo legacy fijo si existe.
 */
export async function resolveLatestOutMp4(kind: OutMp4VideoKind): Promise<string | null> {
  const dir = path.join(process.cwd(), OUT_DIR)
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return null
  }

  const prefix = prefixFor(kind)
  const dated = entries.filter((f) => f.startsWith(prefix) && f.endsWith(".mp4"))

  let best: { name: string; mtime: number } | null = null
  for (const name of dated) {
    const s = await stat(path.join(dir, name)).catch(() => null)
    if (!s) continue
    const mtime = s.mtimeMs
    if (!best || mtime > best.mtime) best = { name, mtime }
  }
  if (best) return path.join(dir, best.name)

  const legacy = legacyName(kind)
  if (entries.includes(legacy)) {
    try {
      await stat(path.join(dir, legacy))
      return path.join(dir, legacy)
    } catch {
      /* empty */
    }
  }

  return null
}
