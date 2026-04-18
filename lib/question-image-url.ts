/** Normaliza el campo opcional `image_url` de una pregunta (admin y APIs). */
export function parseQuestionImageUrl(raw: unknown):
  | { ok: true; value: string | null }
  | { ok: false; error: string } {
  const t = String(raw ?? "").trim()
  if (!t) return { ok: true, value: null }
  if (t.startsWith("/")) {
    if (t.includes("..") || t.length < 2) return { ok: false, error: "Ruta de imagen inválida" }
    return { ok: true, value: t }
  }
  try {
    const u = new URL(t)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "La imagen debe ser una URL http(s)" }
    }
    return { ok: true, value: u.toString() }
  } catch {
    return { ok: false, error: "URL de imagen inválida" }
  }
}
