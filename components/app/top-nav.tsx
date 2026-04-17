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
    <header className="sticky top-0 z-50 min-w-0 max-w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto grid h-14 w-full min-w-0 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-3 sm:h-16 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-1.5 text-zinc-900 sm:gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/25 sm:size-9">
              <CarFront className="size-[16px] sm:size-[18px] md:size-5" aria-hidden />
            </span>
            <span className="min-w-0 truncate text-xs font-semibold leading-tight tracking-tight sm:text-sm md:text-base">
              MiLicencia Argentina Test 🇦🇷
            </span>
          </Link>
        </div>
        <div className="hidden justify-self-center md:flex">
          <NavLinksDesktop />
        </div>
        <div className="flex min-w-0 items-center justify-end justify-self-end gap-1 sm:gap-1.5 md:gap-2">
          {user ? (
            <form action="/auth/signout" method="post">
              <Button variant="outline" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm md:px-4">
                Salir
              </Button>
            </form>
          ) : (
            <>
              <Link href="/login" className="shrink-0">
                <Button variant="secondary" className="h-8 whitespace-nowrap px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm md:px-4">
                  Ingresar
                </Button>
              </Link>
              <Link href="/register" className="shrink-0">
                <Button className="h-8 whitespace-nowrap px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm md:px-4">
                  <Gauge className="mr-0.5 size-3.5 sm:mr-1 sm:size-4" aria-hidden />
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
          <NavLinksMobile />
        </div>
      </div>
    </header>
  )
}
