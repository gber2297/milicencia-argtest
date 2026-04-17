import { mkdirSync, writeFileSync } from "fs"
import { dirname } from "path"

import { MARKETING_RUNTIME_JSON } from "../lib/studio/marketing-paths"
import { writeRemotionMarketingProps } from "../lib/studio/marketing-remotion-props"
import { buildPlaceholderMarketingRuntime } from "../lib/studio/marketing-templates"

async function main() {
  const r = buildPlaceholderMarketingRuntime("five_beat")
  mkdirSync(dirname(MARKETING_RUNTIME_JSON), { recursive: true })
  writeFileSync(MARKETING_RUNTIME_JSON, JSON.stringify(r, null, 2))
  await writeRemotionMarketingProps(r)
  console.log("OK", MARKETING_RUNTIME_JSON)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
