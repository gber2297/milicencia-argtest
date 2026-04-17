"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { VideoRuntime } from "@/types/studio"

const HISTORY_KEY = "studio-history"

export default function StudioHistoryPage() {
  const [items, setItems] = useState<VideoRuntime[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) return
      setItems(JSON.parse(raw) as VideoRuntime[])
    } catch {
      setItems([])
    }
  }, [])

  const clear = () => {
    localStorage.removeItem(HISTORY_KEY)
    setItems([])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
            <History className="size-7 text-blue-600" aria-hidden />
            Historial de renders
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{items.length} entradas en este navegador (localStorage).</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio">
            <Button variant="outline" className="h-9">
              Volver Studio
            </Button>
          </Link>
          <Button variant="secondary" className="h-9" type="button" onClick={clear}>
            Limpiar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="p-4 text-sm text-zinc-600">Todavía no hay renders guardados. Ejecutá “Render video” desde Studio.</Card>
        ) : (
          items.map((r, i) => (
            <Card key={i} className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                {r.videoType} · {r.channel} · {r.meta?.createdAt ?? "sin fecha"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-800">{r.meta?.brief ?? r.scenes[0]?.text ?? "—"}</p>
              <p className="mt-2 text-xs text-zinc-500">{r.scenes.length} escenas</p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
