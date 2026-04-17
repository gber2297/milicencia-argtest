import { mkdir, writeFile } from "fs/promises"
import path from "path"

import type { VideoRuntime } from "@/types/studio"

const ROOT = process.cwd()

/** Props para `npx remotion render … --props=…` */
export const REMOTION_MARKETING_PROPS_JSON = path.join(ROOT, "src", "data", "remotion-marketing-props.json")

export async function writeRemotionMarketingProps(runtime: VideoRuntime): Promise<void> {
  await mkdir(path.dirname(REMOTION_MARKETING_PROPS_JSON), { recursive: true })
  await writeFile(REMOTION_MARKETING_PROPS_JSON, JSON.stringify({ runtime }, null, 2), "utf8")
}
