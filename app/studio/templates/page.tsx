import Link from "next/link"
import { LayoutTemplate } from "lucide-react"

import { TemplateCard } from "@/components/studio/TemplateCard"
import { Button } from "@/components/ui/button"
import { STUDIO_TEMPLATE_DEFINITIONS } from "@/lib/studio/templates"

export default function StudioTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
            <LayoutTemplate className="size-7 text-blue-600" aria-hidden />
            Plantillas
          </h1>
          <p className="mt-1 text-sm text-zinc-600">Definiciones de estructura por tipo de video.</p>
        </div>
        <Link href="/studio">
          <Button variant="outline" className="h-9">
            Volver Studio
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {STUDIO_TEMPLATE_DEFINITIONS.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>
    </div>
  )
}
