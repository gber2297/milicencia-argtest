import { cn } from "@/lib/utils"

interface ArgentinaFlagEmojiProps {
  className?: string
}

/** 🇦🇷 renderizado con fuentes emoji del sistema (evita que se vea "AR" con Geist). */
export function ArgentinaFlagEmoji({ className }: ArgentinaFlagEmojiProps) {
  return (
    <span
      className={cn("font-emoji inline-block align-[-0.12em] text-[1.12em] leading-none not-italic", className)}
      role="img"
      aria-label="Argentina"
    >
      🇦🇷
    </span>
  )
}
