import Link from "next/link"
import { CarFront, Gauge, Trophy } from "lucide-react"

import { NavLinksDesktop, NavLinksMobile } from "@/components/app/nav-links"
import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export async function TopNav() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 text-zinc-900">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/25">
            <CarFront className="size-[18px] sm:size-5" aria-hidden />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">MiLicencia Argentina Test 🇦🇷</span>
        </Link>
        <NavLinksDesktop />
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <form action="/auth/signout" method="post">
              <Button variant="outline" className="h-9 px-3 text-sm sm:px-4">
                Salir
              </Button>
            </form>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" className="h-9 px-3 text-sm sm:px-4">
                  Ingresar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="h-9 px-3 text-sm sm:px-4">
                  <Gauge className="mr-1 size-4" aria-hidden />
                  Empezar
                </Button>
              </Link>
            </>
          )}
          <PremiumCheckoutLink
            appearance="outline"
            className="hidden h-9 gap-1 px-3 md:inline-flex"
          >
            <Trophy className="mr-1 size-4" aria-hidden />
            Premium
          </PremiumCheckoutLink>
        </div>
      </div>
      <NavLinksMobile />
    </header>
  )
}
