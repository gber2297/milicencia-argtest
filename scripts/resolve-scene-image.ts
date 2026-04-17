/**
 * CLI: resuelve URL de imagen para una query (Pexels → Unsplash → estático).
 * Carga .env.local / .env para PEXELS_API_KEY y UNSPLASH_ACCESS_KEY.
 *
 * Uso: npx tsx scripts/resolve-scene-image.ts "road sign argentina"
 */

import { config } from "dotenv"
import { resolve } from "path"

import { resolveSceneImageUrl } from "../lib/studio/resolve-scene-image"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

async function main() {
  const query = process.argv.slice(2).join(" ").trim() || "driving exam vertical"
  const result = await resolveSceneImageUrl(query)
  console.log(JSON.stringify(result, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
