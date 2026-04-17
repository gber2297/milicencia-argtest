/**
 * Resolución de URL de imagen vertical (9:16) para fondos de escena en Studio.
 * Orden: Pexels → Unsplash → mapa estático (sin claves o si fallan las APIs).
 */

export type SceneImageSource = "pexels" | "unsplash" | "static-map"

export interface ResolvedSceneImage {
  url: string
  source: SceneImageSource
  photographer?: string
}

export interface ResolveSceneImageEnv {
  pexelsApiKey?: string
  unsplashAccessKey?: string
}

function envFromProcess(): ResolveSceneImageEnv {
  return {
    pexelsApiKey: process.env.PEXELS_API_KEY?.trim() || undefined,
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY?.trim() || undefined,
  }
}

/** URLs fijas (Unsplash) por palabras en la query; sin búsqueda dinámica. */
function staticFallbackFromQuery(query: string): ResolvedSceneImage {
  const q = query.toLowerCase()

  const entries: { match: RegExp; url: string; label: string }[] = [
    {
      match: /rotonda|roundabout|prioridad/i,
      url: "https://images.unsplash.com/photo-1590673846749-c108ba9e7825?w=1080&h=1920&fit=crop&q=80",
      label: "traffic roundabout",
    },
    {
      match: /señal|senal|sign|pare|ceda|stop/i,
      url: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=1080&h=1920&fit=crop&q=80",
      label: "road signs",
    },
    {
      match: /auto|coche|car|vehículo|volante|conduc|manejo/i,
      url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1080&h=1920&fit=crop&q=80",
      label: "driving",
    },
    {
      match: /examen|test|estudio|libro/i,
      url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&h=1920&fit=crop&q=80",
      label: "study",
    },
  ]

  for (const e of entries) {
    if (e.match.test(q)) {
      return { url: e.url, source: "static-map", photographer: e.label }
    }
  }

  return {
    url: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=1080&h=1920&fit=crop&q=80",
    source: "static-map",
    photographer: "default-vertical",
  }
}

async function fetchPexels(
  query: string,
  apiKey: string,
): Promise<ResolvedSceneImage | null> {
  const params = new URLSearchParams({
    query: query.trim() || "road",
    per_page: "1",
    orientation: "portrait",
  })
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { photos?: { src?: { portrait?: string; large?: string }; photographer?: string }[] }
  const photo = data.photos?.[0]
  const url = photo?.src?.portrait ?? photo?.src?.large
  if (!url) return null
  return { url, source: "pexels", photographer: photo?.photographer }
}

async function fetchUnsplash(
  query: string,
  accessKey: string,
): Promise<ResolvedSceneImage | null> {
  const params = new URLSearchParams({
    query: query.trim() || "road vertical",
    per_page: "1",
    orientation: "portrait",
  })
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    results?: { urls?: { raw?: string }; user?: { name?: string } }[]
  }
  const hit = data.results?.[0]
  const raw = hit?.urls?.raw
  if (!raw) return null
  const url = `${raw}&w=1080&h=1920&fit=crop&q=80`
  return { url, source: "unsplash", photographer: hit?.user?.name }
}

/**
 * Resuelve una URL de imagen portrait para una escena.
 * @param searchQuery Texto de búsqueda (inglés suele funcionar mejor en stock).
 * @param env Opcional; por defecto `PEXELS_API_KEY` y `UNSPLASH_ACCESS_KEY` en `process.env`.
 */
export async function resolveSceneImageUrl(
  searchQuery: string,
  env: ResolveSceneImageEnv = envFromProcess(),
): Promise<ResolvedSceneImage> {
  const q = searchQuery.trim() || "driving road"

  if (env.pexelsApiKey) {
    try {
      const r = await fetchPexels(q, env.pexelsApiKey)
      if (r) return r
    } catch {
      /* siguiente fuente */
    }
  }

  if (env.unsplashAccessKey) {
    try {
      const r = await fetchUnsplash(q, env.unsplashAccessKey)
      if (r) return r
    } catch {
      /* fallback */
    }
  }

  return staticFallbackFromQuery(q)
}
