import * as React from "react"

import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "danger" | "answer"
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const styles = {
    default:
      "rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 hover:brightness-110 hover:shadow-lg hover:shadow-blue-600/35 focus-visible:ring-blue-500/45 active:translate-y-px active:brightness-95 disabled:opacity-50 disabled:hover:brightness-100 disabled:active:translate-y-0",
    secondary:
      "rounded-2xl bg-zinc-100/95 text-zinc-900 shadow-sm shadow-zinc-900/5 hover:bg-zinc-200/90 focus-visible:ring-zinc-400/30 active:bg-zinc-300/80 disabled:opacity-50",
    outline:
      "rounded-2xl border border-zinc-200/90 bg-white/90 text-zinc-800 shadow-sm shadow-zinc-900/5 backdrop-blur-sm hover:border-blue-200/80 hover:bg-blue-50/50 focus-visible:ring-zinc-400/25 active:bg-zinc-100/80 disabled:opacity-50",
    danger: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 focus-visible:ring-red-500/40 disabled:opacity-50",
    answer:
      "border border-zinc-200 bg-white py-3.5 text-left font-normal text-zinc-800 shadow-sm shadow-zinc-950/5 hover:border-zinc-300 hover:bg-zinc-50/90 focus-visible:ring-blue-500/30 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-[0.65] disabled:hover:border-zinc-200 disabled:hover:bg-white disabled:active:scale-100",
  }

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none",
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
