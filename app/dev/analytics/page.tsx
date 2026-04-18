import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { isAnalyticsDashboardEnabled } from "@/lib/analytics/env-analytics-dashboard"
import { tryCreateAdminClient } from "@/lib/supabase/admin"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Tracking (dev)",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface AnalyticsRow {
  id: string
  created_at: string
  event_name: string
  path: string | null
  referrer: string | null
  props: Record<string, unknown>
  session_id: string | null
  user_id: string | null
  user_agent: string | null
}

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "medium",
})

type AudienceFilter = "all" | "logged" | "anon"

function parseAudience(raw: string | undefined): AudienceFilter {
  if (raw === "logged" || raw === "anon") return raw
  return "all"
}

interface DevAnalyticsPageProps {
  searchParams: Promise<{ audience?: string }>
}

export default async function DevAnalyticsPage({ searchParams }: DevAnalyticsPageProps) {
  if (!isAnalyticsDashboardEnabled()) {
    redirect("/")
  }

  const sp = await searchParams
  const audience = parseAudience(sp.audience)

  const admin = tryCreateAdminClient()
  let rows: AnalyticsRow[] = []
  let loadError: string | null = null

  if (!admin) {
    loadError = "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor: no se puede leer la tabla."
  } else {
    let q = admin
      .from("web_analytics_events")
      .select(
        "id, created_at, event_name, path, referrer, props, session_id, user_id, user_agent",
      )
      .order("created_at", { ascending: false })
      .limit(500)

    if (audience === "logged") {
      q = q.not("user_id", "is", null)
    } else if (audience === "anon") {
      q = q.is("user_id", null)
    }

    const { data, error } = await q

    if (error) {
      loadError = error.message
    } else {
      rows = (data ?? []) as AnalyticsRow[]
    }
  }

  const filterLink = (key: AudienceFilter, label: string) => {
    const href = key === "all" ? "/dev/analytics" : `/dev/analytics?audience=${key}`
    return (
      <Link
        href={href}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-medium transition",
          audience === key
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
        )}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tracking (solo local)</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Últimos eventos en <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">web_analytics_events</code>.             Los
            envíos van a <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">/api/telemetry/event</code> (no
            “analytics”, para evitar bloqueo por adblock). En <code className="text-xs">next dev</code> no se envían
            eventos a Supabase (solo tráfico del sitio ya desplegado), salvo{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_ANALYTICS_CAPTURE_DEV=true</code>.
            En producción esta ruta está desactivada (mismo criterio que{" "}
            <Link href="/studio" className="font-medium text-blue-600 underline-offset-2 hover:underline">
              Studio
            </Link>
            ). Forzar en deploy:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_ANALYTICS_DASHBOARD_ENABLED=true</code>
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
        >
          Volver al inicio
        </Link>
      </div>

      {loadError ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
        <span className="text-sm font-medium text-zinc-600">Audiencia:</span>
        {filterLink("all", "Todos")}
        {filterLink("logged", "Con sesión")}
        {filterLink("anon", "Sin sesión")}
        <span className="ml-auto text-xs text-zinc-500">
          {audience === "all" && "Incluye visitantes y usuarios logueados."}
          {audience === "logged" && "Solo filas con user_id (telemetry con cookie de sesión)."}
          {audience === "anon" && "Solo visitantes: user_id vacío en el evento."}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3 text-sm text-zinc-600">
          {rows.length} evento{rows.length === 1 ? "" : "s"} (máx. 500)
        </div>
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="border-b border-zinc-200 px-3 py-2">Cuándo</th>
                <th className="border-b border-zinc-200 px-3 py-2">Evento</th>
                <th className="border-b border-zinc-200 px-3 py-2">Path</th>
                <th className="border-b border-zinc-200 px-3 py-2">Usuario</th>
                <th className="border-b border-zinc-200 px-3 py-2">Sesión</th>
                <th className="border-b border-zinc-200 px-3 py-2">Props</th>
              </tr>
            </thead>
            <tbody className="text-zinc-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Todavía no hay eventos. Navegá el sitio o generá tráfico de prueba.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50/80">
                    <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-zinc-600">
                      {dateFmt.format(new Date(r.created_at))}
                    </td>
                    <td className="px-3 py-2 align-top font-medium">{r.event_name}</td>
                    <td className="max-w-[220px] px-3 py-2 align-top">
                      <span className="line-clamp-2 break-all text-xs" title={r.path ?? ""}>
                        {r.path ?? "—"}
                      </span>
                    </td>
                    <td className="max-w-[120px] px-3 py-2 align-top">
                      <span className="line-clamp-2 break-all font-mono text-[11px] text-zinc-600">
                        {r.user_id ?? "—"}
                      </span>
                    </td>
                    <td className="max-w-[120px] px-3 py-2 align-top">
                      <span className="line-clamp-2 break-all font-mono text-[11px] text-zinc-600">
                        {r.session_id ?? "—"}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-3 py-2 align-top">
                      <pre className="max-h-24 overflow-auto rounded bg-zinc-50 p-2 font-mono text-[10px] leading-snug text-zinc-700">
                        {JSON.stringify(r.props, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
