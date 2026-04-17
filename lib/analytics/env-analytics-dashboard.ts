/**
 * Panel `/dev/analytics`: desactivado en producción salvo que se fuerce con env.
 * En `next dev` queda activo por defecto (igual que Video Studio).
 *
 * Producción sin flag: 403 / redirect.
 * Forzar en deploy: NEXT_PUBLIC_ANALYTICS_DASHBOARD_ENABLED=true
 */
export function isAnalyticsDashboardEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_ANALYTICS_DASHBOARD_ENABLED
  if (v === "true") return true
  if (v === "false") return false
  return process.env.NODE_ENV !== "production"
}
