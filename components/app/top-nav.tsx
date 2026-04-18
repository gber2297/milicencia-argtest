import Image from "next/image"
import Link from "next/link"
import { Trophy } from "lucide-react"

import { ArgentinaFlagEmoji } from "@/components/app/argentina-flag-emoji"
import { NavLinksDesktop, NavLinksMobile } from "@/components/app/nav-links"
import { PremiumCheckoutLink } from "@/components/app/premium-links"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export async function TopNav() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  const authenticated = Boolean(user)

  return (
    <header className="sticky top-0 z-50 min-w-0 max-w-full border-b border-white/60 bg-white/75 shadow-sm shadow-blue-500/[0.06] backdrop-blur-xl">
      <div className="mx-auto grid h-14 w-full min-w-0 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-3 sm:h-16 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={authenticated ? "/dashboard" : "/"}
            className="flex min-w-0 flex-1 items-center gap-2 text-zinc-900 transition hover:opacity-90 sm:gap-2.5"
          >
            <Image
              src="/logo.png"
              alt="Mi Licencia"
              width={40}
              height={40}
              className="size-9 shrink-0 rounded-xl object-contain sm:size-10"
              priority
            />
            <span className="flex min-w-0 items-center gap-1 truncate text-xs font-semibold leading-tight tracking-tight sm:gap-1.5 sm:text-sm md:text-base">
              <span className="truncate">MiLicencia Argentina Test</span>
              <ArgentinaFlagEmoji className="shrink-0" />
            </span>
          </Link>
        </div>
        <div className="hidden justify-self-center md:flex">
          <NavLinksDesktop authenticated={authenticated} />
        </div>
        <div className="flex min-w-0 items-center justify-end justify-self-end gap-1 sm:gap-1.5 md:gap-2">
          {authenticated ? (
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
                  Comenzar
                </Button>
              </Link>
            </>
          )}
          {authenticated ? (
            <PremiumCheckoutLink appearance="outline" choosePlanFirst className="hidden h-9 gap-1 px-3 md:inline-flex">
              <Trophy className="mr-1 size-4" aria-hidden />
              Premium
            </PremiumCheckoutLink>
          ) : null}
          <NavLinksMobile authenticated={authenticated} />
        </div>
      </div>
    </header>
  )
}
