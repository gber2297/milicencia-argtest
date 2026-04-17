declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    plausible?: (
      eventName: string,
      options?: { u?: string; props?: Record<string, unknown> },
    ) => void
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

const SESSION_KEY = "mi_lic_analytics_session"

function analyticsEnabled() {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false"
}

/**
 * Supabase solo recibe eventos del sitio en producción (build `next build` / Vercel).
 * En `next dev` no se envía nada → no mezclás tu navegación local con usuarios reales.
 * Para probar el pipeline contra tu DB: NEXT_PUBLIC_ANALYTICS_CAPTURE_DEV=true en .env.local
 */
function captureFirstPartyToSupabase() {
  if (!analyticsEnabled()) return false
  if (process.env.NEXT_PUBLIC_ANALYTICS_CAPTURE_DEV === "true") return true
  return process.env.NODE_ENV === "production"
}

function analyticsDebug() {
  return (
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true" ||
    process.env.NODE_ENV === "development"
  )
}

function getSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return undefined
  }
}

/** No usar `/api/analytics/*`: muchos adblockers lo bloquean. */
const TELEMETRY_URL = "/api/telemetry/event"

async function sendFirstParty(input: {
  event: string
  path?: string
  referrer?: string
  props?: Record<string, unknown>
}) {
  if (typeof window === "undefined" || !captureFirstPartyToSupabase()) return
  const body = {
    event: input.event,
    path: input.path,
    referrer: input.referrer ?? (typeof document !== "undefined" ? document.referrer || undefined : undefined),
    sessionId: getSessionId(),
    props: input.props,
  }
  try {
    const res = await fetch(TELEMETRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    })
    const data = (await res.json().catch(() => ({}))) as {
      accepted?: boolean
      reason?: string
      detail?: string
      hint?: string
    }
    if (data.accepted === false && analyticsDebug()) {
      console.warn("[telemetry]", data.reason, data.detail ?? "", data.hint ?? "")
    }
    if (!res.ok && analyticsDebug()) {
      console.warn("[telemetry] HTTP", res.status, data)
    }
  } catch (e) {
    if (analyticsDebug()) {
      console.warn("[telemetry] fetch failed", e)
    }
  }
}

/**
 * Evento de analítica propia (Supabase) + opcional GA4 / Plausible si están cargados.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  void sendFirstParty({ event: name, path: window.location.pathname + window.location.search, props: params })
  window.gtag?.("event", name, params)
  try {
    window.plausible?.(name, { props: params })
  } catch {
    /* Plausible opcional */
  }
}

/** Page views: SPA + analítica propia. */
export function trackPageView(pathWithQuery: string) {
  if (typeof window === "undefined") return
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`
  void sendFirstParty({
    event: "page_view",
    path,
    referrer: document.referrer || undefined,
    props: { title: document.title },
  })
  if (GA_ID) {
    window.gtag?.("event", "page_view", {
      page_path: path,
      page_title: document.title,
    })
  }
  try {
    const href = `${window.location.origin}${path}`
    window.plausible?.("pageview", { u: href })
  } catch {
    /* Plausible opcional */
  }
}
