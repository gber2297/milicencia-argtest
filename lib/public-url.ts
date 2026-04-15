/**
 * Origen público para redirects en Route Handlers (evita `https://0.0.0.0/...` detrás de Docker/proxy).
 *
 * En producción definí `APP_URL` (recomendado) o `NEXT_PUBLIC_APP_URL`, p. ej. `https://tu-dominio.com`
 */
export function getPublicOrigin(request: Request): string {
  const fromEnv = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  if (forwardedHost) {
    const proto = forwardedProto || "https"
    return `${proto}://${forwardedHost}`
  }

  const host = request.headers.get("host")?.split(",")[0]?.trim()
  if (host && host !== "0.0.0.0:80" && !host.startsWith("0.0.0.0:")) {
    const proto = forwardedProto || "https"
    return `${proto}://${host}`
  }

  return new URL(request.url).origin
}

export function publicRedirectUrl(request: Request, pathnameWithQuery: string): URL {
  return new URL(pathnameWithQuery, `${getPublicOrigin(request)}/`)
}
