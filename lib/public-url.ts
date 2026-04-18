/**
 * Origen público para redirects en Route Handlers (evita `https://0.0.0.0/...` detrás de Docker/proxy).
 *
 * En producción definí `APP_URL` (recomendado) o `NEXT_PUBLIC_APP_URL`, p. ej. `https://tu-dominio.com`
 *
 * En desarrollo: si `APP_URL` apunta al dominio de producción pero entrás por `localhost`,
 * se usa el origen del request para que el login no te mande al sitio en vivo.
 */

function isLocalDevHost(host: string): boolean {
  const hostname = host.split(":")[0]?.replace(/^\[|\]$/g, "").toLowerCase() ?? ""
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  )
}

function parseEnvOriginHost(fromEnv: string): string | null {
  try {
    const withProto =
      fromEnv.startsWith("http://") || fromEnv.startsWith("https://") ? fromEnv : `https://${fromEnv}`
    return new URL(withProto).host
  } catch {
    return null
  }
}

export function getPublicOrigin(request: Request): string {
  const requestUrl = new URL(request.url)
  const requestHost = requestUrl.host

  const fromEnv = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) {
    const normalized = fromEnv.replace(/\/$/, "")
    if (process.env.NODE_ENV === "development") {
      const envHost = parseEnvOriginHost(normalized)
      if (envHost && isLocalDevHost(requestHost) && !isLocalDevHost(envHost)) {
        return `${requestUrl.protocol}//${requestHost}`
      }
    }
    return normalized
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  if (forwardedHost) {
    const proto = forwardedProto || "https"
    return `${proto}://${forwardedHost}`
  }

  const host = request.headers.get("host")?.split(",")[0]?.trim()
  if (host && host !== "0.0.0.0:80" && !host.startsWith("0.0.0.0:")) {
    const proto = forwardedProto || (isLocalDevHost(host) ? "http" : "https")
    return `${proto}://${host}`
  }

  return requestUrl.origin
}

export function publicRedirectUrl(request: Request, pathnameWithQuery: string): URL {
  return new URL(pathnameWithQuery, `${getPublicOrigin(request)}/`)
}
