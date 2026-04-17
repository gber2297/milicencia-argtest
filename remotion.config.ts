import path from "path"

import type { WebpackOverrideFn } from "@remotion/cli/config"
import { Config } from "@remotion/cli/config"

const override: WebpackOverrideFn = (config) => {
  const prev = config.resolve?.alias
  const alias = {
    ...(typeof prev === "object" && prev !== null && !Array.isArray(prev) ? prev : {}),
    "@": path.resolve(process.cwd()),
  }
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias,
    },
  }
}

Config.overrideWebpackConfig(override)
