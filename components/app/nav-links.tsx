"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const DESKTOP_LINKS = [
  { href: "/dashboard", label: "Dashboard", match: (p: string) => p === "/dashboard" },
  { href: "/practice", label: "Practica", match: (p: string) => p.startsWith("/practice") },
  { href: "/exam", label: "Simulacro", match: (p: string) => p.startsWith("/exam") },
  { href: "/progress", label: "Progreso", match: (p: string) => p === "/progress" },
  { href: "/weak-areas", label: "Mejorar", match: (p: string) => p === "/weak-areas" },
] as const

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Inicio", match: (p: string) => p === "/dashboard" },
  { href: "/practice", label: "Practica", match: (p: string) => p.startsWith("/practice") },
  { href: "/exam", label: "Examen", match: (p: string) => p.startsWith("/exam") },
  { href: "/progress", label: "Progreso", match: (p: string) => p === "/progress" },
] as const

export function NavLinksDesktop() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Principal">
      {DESKTOP_LINKS.map(({ href, label, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function NavLinksMobile() {
  const pathname = usePathname()
  return (
    <nav className="grid grid-cols-4 gap-1 border-t border-zinc-200/80 bg-zinc-50/50 px-2 py-2 md:hidden" aria-label="Principal movil">
      {MOBILE_LINKS.map(({ href, label, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg py-2 text-center text-xs font-medium transition-colors",
              active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
