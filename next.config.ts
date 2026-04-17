import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["remotion", "@remotion/player"],
  /**
   * edge-tts-universal → isomorphic-ws → `ws`. Si Webpack/Turbopack empaqueta `ws`,
   * falla en runtime: `bufferUtil.mask is not a function` (opcionales bufferutil).
   */
  serverExternalPackages: [
    "edge-tts-universal",
    "isomorphic-ws",
    "ws",
    "axios",
    "music-metadata",
  ],
  /** Imagen Docker mínima (`output` genera `.next/standalone`). */
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  /** Solo aplica con `next dev --webpack`: reduce watchers sobre carpetas de datos/scripts. */
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 400,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/tmp/**",
          "**/scripts/**",
        ],
      }
    }
    return config
  },
}

export default nextConfig
