import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isAnalyticsDashboardEnabled } from "@/lib/analytics/env-analytics-dashboard"
import { isStudioEnabled } from "@/lib/studio/env-studio"

const PROTECTED = [
  "/dashboard",
  "/onboarding",
  "/practice",
  "/exam",
  "/results",
  "/progress",
  "/weak-areas",
  "/profile",
  "/admin",
]

const AUTH_ONLY = ["/login", "/register"]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (
    !isStudioEnabled() &&
    (pathname.startsWith("/studio") || pathname.startsWith("/api/studio"))
  ) {
    return NextResponse.json(
      {
        error:
          "Video Studio está desactivado en este entorno (p. ej. build de producción). Añadí NEXT_PUBLIC_STUDIO_ENABLED=true en .env.local y reiniciá el servidor.",
        code: "STUDIO_DISABLED",
      },
      { status: 403 },
    )
  }

  if (!isAnalyticsDashboardEnabled() && pathname.startsWith("/dev/analytics")) {
    const home = request.nextUrl.clone()
    home.pathname = "/"
    return NextResponse.redirect(home)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const isProtected = PROTECTED.some((route) => pathname.startsWith(route))
  const isAuthPage = AUTH_ONLY.some((route) => pathname.startsWith(route))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPage && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
