"use client"

import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface FaqEntry {
  q: string
  a: string
}

interface FaqAccordionProps {
  items: FaqEntry[]
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const baseId = useId()

  return (
    <div className="flex w-full flex-col gap-3">
      {items.map((item, i) => {
        const open = openIndex === i
        const panelId = `${baseId}-panel-${i}`
        const headerId = `${baseId}-header-${i}`
        return (
          <Card
            key={item.q}
            className="overflow-hidden rounded-2xl border-zinc-200/90 bg-white/95 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg"
          >
            <button
              type="button"
              id={headerId}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
            >
              <span className="text-base font-bold leading-snug text-zinc-900 sm:text-lg">{item.q}</span>
              <ChevronDown
                className={cn("mt-0.5 size-5 shrink-0 text-[var(--brand-blue)] transition-transform duration-200", open && "rotate-180")}
                aria-hidden
              />
            </button>
            <div id={panelId} role="region" aria-labelledby={headerId} hidden={!open} className="border-t border-zinc-100">
              <p className="px-5 py-4 text-sm leading-relaxed text-zinc-600 sm:px-6 sm:text-base">{item.a}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
