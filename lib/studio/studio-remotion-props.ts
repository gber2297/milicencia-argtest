import { mkdir, writeFile } from "fs/promises"
import path from "path"

import type { VideoRuntime } from "@/types/studio"

const ROOT = process.cwd()

/** Props para `npx remotion render … MiLicenciaVideo --props=…` */
export const REMOTION_STUDIO_PROPS_JSON = path.join(ROOT, "src", "data", "remotion-studio-props.json")

export async function writeRemotionStudioProps(runtime: VideoRuntime): Promise<void> {
  await mkdir(path.dirname(REMOTION_STUDIO_PROPS_JSON), { recursive: true })
  await writeFile(REMOTION_STUDIO_PROPS_JSON, JSON.stringify({ runtime }, null, 2), "utf8")
}
