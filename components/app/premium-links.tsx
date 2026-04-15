import Link from "next/link"

import { getPremiumCheckoutHref, isExternalCheckoutUrl } from "@/lib/checkout"
import { cn } from "@/lib/utils"

const primaryClass =
  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"

const outlineClass =
  "inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300/90 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/25 focus-visible:ring-offset-2"

interface PremiumCheckoutLinkProps {
  children: React.ReactNode
  className?: string
  appearance?: "text" | "primary" | "outline"
  onNavigate?: () => void
}

export function PremiumCheckoutLink({
  children,
  className,
  appearance = "text",
  onNavigate,
}: PremiumCheckoutLinkProps) {
  const href = getPremiumCheckoutHref()
  const external = isExternalCheckoutUrl(href)

  const appearanceClass =
    appearance === "primary" ? primaryClass : appearance === "outline" ? outlineClass : undefined

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(appearanceClass, className)}
      onClick={onNavigate}
    >
      {children}
    </Link>
  )
}
