import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-blue-100/80 bg-blue-50/90 px-2.5 py-1 text-xs font-medium text-blue-800",
        className,
      )}
      {...props}
    />
  )
}
