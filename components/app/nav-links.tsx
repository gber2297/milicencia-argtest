"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { isStudioEnabled } from "@/lib/studio/env-studio"
import { cn } from "@/lib/utils"

const GUEST_LINKS = [
  { href: "/#caracteristicas", label: "Características" },
  { href: "/#planes", label: "Planes" },
  { href: "/#faq", label: "FAQs" },
] as const

const DESKTOP_LINKS_BASE = [
  { href: "/dashboard", label: "Dashboard", match: (p: string) => p === "/dashboard" },
  { href: "/practice", label: "Practica", match: (p: string) => p.startsWith("/practice") },
  { href: "/exam", label: "Simulacro", match: (p: string) => p.startsWith("/exam") },
  { href: "/progress", label: "Progreso", match: (p: string) => p === "/progress" },
  { href: "/weak-areas", label: "Mejorar", match: (p: string) => p === "/weak-areas" },
] as const

const STUDIO_LINK = {
  href: "/studio",
  label: "Studio",
  match: (p: string) => p.startsWith("/studio"),
} as const

function getAppLinks() {
  if (!isStudioEnabled()) return [...DESKTOP_LINKS_BASE]
  return [...DESKTOP_LINKS_BASE, STUDIO_LINK]
}

const linkClass = (active: boolean) =>
  cn(
    "rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200",
    active
      ? "bg-gradient-to-r from-blue-50/95 to-violet-50/70 text-[var(--brand-blue)] shadow-sm shadow-blue-500/10 ring-1 ring-blue-200/50"
      : "text-zinc-600 hover:bg-white/90 hover:text-zinc-900 hover:shadow-sm",
  )

export function NavLinksDesktop({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname()

  if (!authenticated) {
    return (
      <nav className="flex items-center gap-0.5" aria-label="Principal">
        {GUEST_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={linkClass(false)}>
            {label}
          </Link>
        ))}
      </nav>
    )
  }

  const links = getAppLinks()
  return (
    <nav className="flex items-center gap-0.5" aria-label="Principal">
      {links.map(({ href, label, match }) => {
        const active = match(pathname)
        return (
          <Link key={href} href={href} className={linkClass(active)}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function NavLinksMobileInner({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname()
  const guestLinks = [...GUEST_LINKS]
  const appLinks = getAppLinks()
  const links = authenticated ? appLinks : guestLinks
  const active = authenticated
    ? appLinks.find((l) => l.match(pathname)) ?? appLinks[0]
    : guestLinks[0]
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative z-[100] shrink-0 md:hidden">
      <nav aria-label="Principal movil">
        <button
          type="button"
          id={`${menuId}-trigger`}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={menuId}
          title={active.label}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100/90 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 sm:h-9 sm:w-9",
            open && "bg-zinc-100/80 text-zinc-900",
          )}
        >
          <span className="sr-only">Secciones: {active.label}. Abrir menu</span>
          <Menu className="size-[18px] sm:size-5" aria-hidden />
        </button>

        {open ? (
          <div
            id={menuId}
            role="region"
            aria-labelledby={`${menuId}-trigger`}
            className="absolute right-0 top-full z-[110] mt-1 max-h-[min(70vh,22rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-auto rounded-2xl border border-white/80 bg-white/95 py-1 shadow-xl shadow-blue-500/10 backdrop-blur-md"
          >
            <p className="border-b border-zinc-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ir a
            </p>
            {authenticated
              ? appLinks.map(({ href, label, match }) => {
                  const isActive = match(pathname)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block px-3 py-2.5 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-violet-50/80 text-[var(--brand-blue)]"
                          : "text-zinc-700 hover:bg-blue-50/50 hover:text-zinc-900",
                      )}
                    >
                      {label}
                    </Link>
                  )
                })
              : guestLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-blue-50/50 hover:text-zinc-900"
                  >
                    {label}
                  </Link>
                ))}
          </div>
        ) : null}
      </nav>
    </div>
  )
}

export function NavLinksMobile({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname()
  return <NavLinksMobileInner key={`${pathname}-${authenticated}`} authenticated={authenticated} />
}
