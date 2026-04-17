"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

import { trackPageView } from "@/lib/analytics"

function AnalyticsPageViewsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const q = searchParams?.toString()
    const path = q ? `${pathname}?${q}` : pathname
    trackPageView(path)
  }, [pathname, searchParams])

  return null
}

/** Envía page_view en cada navegación (analítica propia + opcional GA/Plausible). */
export function AnalyticsPageViews() {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") {
    return null
  }

  return (
    <Suspense fallback={null}>
      <AnalyticsPageViewsInner />
    </Suspense>
  )
}
