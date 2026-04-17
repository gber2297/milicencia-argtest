/**
 * Video Studio: desactivado en builds de producción salvo que se fuerce con env.
 * En `next dev` queda activo por defecto (NODE_ENV !== production).
 *
 * Para probar un build local tipo prod sin Studio: NEXT_PUBLIC_STUDIO_ENABLED=false
 * Para habilitar Studio en un deploy: NEXT_PUBLIC_STUDIO_ENABLED=true
 */
export function isStudioEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_STUDIO_ENABLED
  if (v === "true") return true
  if (v === "false") return false
  return process.env.NODE_ENV !== "production"
}
