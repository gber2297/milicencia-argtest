import path from "node:path"
import { readFile } from "node:fs/promises"
import Link from "next/link"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Preview · Cuestionario JSON",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface Opcion {
  letra: string
  texto: string
  es_correcta: boolean
}

interface Pregunta {
  id: number
  texto: string
  respuestas_correctas: string[]
  opciones: Opcion[]
  imagen_pagina?: string | null
  pagina_fuente?: number | null
}

interface Payload {
  titulo?: string
  generado?: string
  estadisticas?: Record<string, unknown>
  notas?: string[]
  preguntas: Pregunta[]
}

interface PageProps {
  searchParams: Promise<{ limit?: string; all?: string }>
}

const CuestionarioPreviewPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const showAll = params.all === "1" || params.all === "true"
  const parsedLimit = Number(params.limit)
  const defaultCap = 150
  const maxCap = 2000
  const limit = showAll
    ? maxCap
    : Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, maxCap)
      : defaultCap

  let data: Payload = { preguntas: [] }
  let loadError: string | null = null

  try {
    const raw = await readFile(
      path.join(process.cwd(), "cuestionario-compilado.json"),
      "utf8",
    )
    data = JSON.parse(raw) as Payload
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Error desconocido"
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
        <p className="font-medium">No se pudo leer cuestionario-compilado.json</p>
        <p className="mt-2 text-sm">{loadError}</p>
        <p className="mt-3 text-sm text-red-800">
          Generá el archivo con:{" "}
          <code className="rounded bg-red-100 px-1 py-0.5 text-xs">
            npm run parse:html:questions &amp;&amp; npm run build:cuestionario
          </code>
        </p>
      </div>
    )
  }

  const { titulo, generado, estadisticas, notas, preguntas = [] } = data
  const shown = preguntas.slice(0, limit)
  const total = preguntas.length

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Vista previa del JSON compilado
        </h1>
        <p className="text-sm text-zinc-600">
          {titulo}
          {generado ? ` · ${generado}` : ""}
        </p>
        <p className="text-sm text-zinc-600">
          Mostrando{" "}
          <strong>
            {shown.length} de {total}
          </strong>{" "}
          preguntas
          {shown.length < total ? (
            <>
              .{" "}
              <Link
                href="/dev/cuestionario-preview?all=1"
                className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
              >
                Ver hasta {maxCap} (casi todas)
              </Link>
              {" · "}
              <Link
                href="/dev/cuestionario-preview?limit=50"
                className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
              >
                Solo 50
              </Link>
            </>
          ) : null}
        </p>
        {estadisticas ? (
          <pre className="max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-zinc-100 p-3 text-xs text-zinc-800">
            {JSON.stringify(estadisticas, null, 2)}
          </pre>
        ) : null}
        {notas?.length ? (
          <ul className="list-inside list-disc text-xs text-zinc-500">
            {notas.map((n, idx) => (
              <li key={idx}>{n}</li>
            ))}
          </ul>
        ) : null}
      </header>

      <ul className="space-y-4 pb-12">
        {shown.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-emerald-800">
                #{p.id}
              </span>
              {p.pagina_fuente != null ? (
                <span className="text-xs text-zinc-500">p. {p.pagina_fuente}</span>
              ) : null}
              {p.respuestas_correctas?.length ? (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                  Correctas: {p.respuestas_correctas.join(", ")}
                </span>
              ) : (
                <span className="text-xs text-amber-700">Sin correctas detectadas</span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-800">
              {p.texto?.trim() ? p.texto : "(sin enunciado)"}
            </p>
            {p.imagen_pagina ? (
              <p className="mt-1 font-mono text-xs text-zinc-500">{p.imagen_pagina}</p>
            ) : null}
            <ol className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3">
              {p.opciones?.map((o) => (
                <li
                  key={`${p.id}-${o.letra}`}
                  className={
                    o.es_correcta
                      ? "text-sm font-medium text-emerald-900"
                      : "text-sm text-zinc-700"
                  }
                >
                  <span className="font-mono text-zinc-500">{o.letra}.</span> {o.texto}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CuestionarioPreviewPage
