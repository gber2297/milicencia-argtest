import { mkdir } from "fs/promises"
import { spawn } from "node:child_process"
import path from "path"

import { renderTimestamp } from "@/lib/studio/render"
import { writeRemotionMarketingProps } from "@/lib/studio/marketing-remotion-props"
import { writeRemotionStudioProps } from "@/lib/studio/studio-remotion-props"
import type { VideoRuntime } from "@/types/studio"

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, "out")

/** Evita acumular strings gigantes del progreso de Remotion en memoria. */
const MAX_LOG_CHARS = 2_000_000

export type RemotionRenderKind = "studio" | "marketing"

export interface RenderVideoToOutOptions {
  stamp?: string
}

export type RenderVideoToOutResult =
  | { ok: true; log: string; outputFilename: string; outputAbsolutePath: string }
  | { ok: false; error: string; log: string }

function trimLog(s: string) {
  if (s.length <= MAX_LOG_CHARS) return s
  return `…(truncado)\n${s.slice(-MAX_LOG_CHARS)}`
}

/**
 * En Windows (Node 20+), `execFile('npx.cmd', …)` puede fallar con EINVAL.
 * `spawn` + `shell: true` respeta el PATH y los `.cmd` como en la terminal.
 */
function spawnRemotionRender(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const isWin = process.platform === "win32"
  const cmd = isWin ? "npx.cmd" : "npx"
  const fullArgs = ["remotion", "render", ...args]

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, fullArgs, {
      cwd: ROOT,
      shell: isWin,
      env: { ...process.env },
      windowsHide: true,
    })

    let stdout = ""
    let stderr = ""
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString()
      if (stdout.length > MAX_LOG_CHARS) stdout = stdout.slice(-MAX_LOG_CHARS)
    })
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString()
      if (stderr.length > MAX_LOG_CHARS) stderr = stderr.slice(-MAX_LOG_CHARS)
    })
    child.on("error", reject)
    child.on("close", (code) => {
      resolve({ stdout, stderr, code })
    })
  })
}

export async function renderVideoToOut(
  kind: RemotionRenderKind,
  runtime: VideoRuntime,
  options?: RenderVideoToOutOptions,
): Promise<RenderVideoToOutResult> {
  await mkdir(OUT_DIR, { recursive: true })
  if (kind === "marketing") await writeRemotionMarketingProps(runtime)
  else await writeRemotionStudioProps(runtime)

  const stamp = options?.stamp ?? renderTimestamp()
  const outputFilename = kind === "marketing" ? `marketing-${stamp}.mp4` : `studio-${stamp}.mp4`
  /** Ruta relativa: Remotion y npm scripts la usan sin problemas de escape en Windows. */
  const outRelative = path.posix.join("out", outputFilename)
  const outputAbsolutePath = path.join(ROOT, "out", outputFilename)

  const composition = kind === "marketing" ? "AppMarketingVideo" : "MiLicenciaVideo"
  const propsRel =
    kind === "marketing"
      ? "src/data/remotion-marketing-props.json"
      : "src/data/remotion-studio-props.json"

  const renderArgs = [
    "remotion/index.ts",
    composition,
    outRelative,
    `--props=${propsRel}`,
  ]

  try {
    const { stdout, stderr, code } = await spawnRemotionRender(renderArgs)
    const log = trimLog([stdout, stderr].filter(Boolean).join("\n"))
    if (code !== 0) {
      return {
        ok: false,
        error: `Remotion terminó con código ${code}.${log ? `\n${log}` : ""}`,
        log,
      }
    }
    return { ok: true, log, outputFilename, outputAbsolutePath }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      error: msg,
      log: "",
    }
  }
}
