import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-blue-500/[0.06] backdrop-blur-sm sm:p-6",
        className,
      )}
      {...props}
    />
  )
}
