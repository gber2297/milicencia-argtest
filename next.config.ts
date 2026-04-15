import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
