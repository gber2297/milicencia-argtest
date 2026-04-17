import { Card } from "@/components/ui/card"
import type { StudioTemplateDefinition } from "@/lib/studio/templates"
import { cn } from "@/lib/utils"

interface TemplateCardProps {
  template: StudioTemplateDefinition
  onSelect?: (id: string) => void
  className?: string
}

export const TemplateCard = ({ template, onSelect, className }: TemplateCardProps) => {
  return (
    <Card
      className={cn(
        "cursor-pointer p-4 transition hover:border-blue-300 hover:shadow-md",
        className,
      )}
      onClick={() => onSelect?.(template.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.(template.id)
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{template.videoType}</p>
      <p className="mt-1 font-semibold text-zinc-900">{template.name}</p>
      <p className="mt-1 text-sm text-zinc-600">{template.description}</p>
      <p className="mt-2 text-xs text-zinc-500">
        ~{template.idealSeconds[0]}–{template.idealSeconds[1]}s · {template.sceneCount} escenas
      </p>
    </Card>
  )
}
