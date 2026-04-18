import { getPublicOrigin } from "@/lib/public-url"

/**
 * Mercado Pago valida `back_url` estrictamente. A veces rechaza `http://localhost` en pruebas.
 * Definí MERCADOPAGO_BACK_URL con tu URL https de producción (ej. …/pricing?mp=1) si falla en local.
 */
export function getMercadoPagoBackUrl(request: Request): string {
  const explicit =
    process.env.MERCADOPAGO_BACK_URL?.trim() || process.env.NEXT_PUBLIC_MERCADOPAGO_BACK_URL?.trim()
  if (explicit) {
    try {
      const u = new URL(explicit)
      if (u.protocol === "http:" || u.protocol === "https:") return u.href
    } catch {
      /* continuar */
    }
  }

  const origin = getPublicOrigin(request).replace(/\/+$/, "")
  const back = `${origin}/pricing?mp=1`

  try {
    const u = new URL(back)
    if (u.protocol === "http:" || u.protocol === "https:") return u.href
  } catch {
    /* continuar */
  }

  const fallback = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fallback) {
    const base = fallback.replace(/\/$/, "")
    try {
      return new URL(`${base}/pricing?mp=1`).href
    } catch {
      /* continuar */
    }
  }

  throw new Error(
    "No se pudo armar back_url para Mercado Pago. Definí MERCADOPAGO_BACK_URL (https://tu-dominio/pricing?mp=1) o APP_URL.",
  )
}
