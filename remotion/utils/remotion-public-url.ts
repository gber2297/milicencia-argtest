import { staticFile } from "remotion"

/**
 * En `remotion render`, rutas tipo `/logo.png` deben resolverse con `staticFile` (archivo en `public/`).
 * URLs `http(s)://` se dejan; el resto se trata como ruta bajo `public/`.
 */
export function remotionPublicUrl(href: string | undefined, fallbackFile = "logo.png"): string {
  const raw = href?.trim() || fallbackFile
  if (/^https?:\/\//i.test(raw)) return raw
  const path = raw.replace(/^\//, "")
  return staticFile(path)
}
