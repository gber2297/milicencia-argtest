"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Braces } from "lucide-react"

import { RuntimeEditor } from "@/components/studio/RuntimeEditor"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { generateSampleRuntime } from "@/lib/studio/generators"
import type { VideoRuntime } from "@/types/studio"

const STORAGE_KEY = "studio-runtime-draft"

export default function StudioRuntimePage() {
  const [runtime, setRuntime] = useState<VideoRuntime>(() => generateSampleRuntime())
  const [version, setVersion] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRuntime(JSON.parse(raw) as VideoRuntime)
    } catch {
      /* ignore */
    }
  }, [])

  const persist = (r: VideoRuntime) => {
    setRuntime(r)
    setVersion((v) => v + 1)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
            <Braces className="size-7 text-blue-600" aria-hidden />
            Runtime JSON
          </h1>
          <p className="mt-1 text-sm text-zinc-600">Edición avanzada del payload compartido con Remotion.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio">
            <Button variant="outline" className="h-9">
              Volver Studio
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            className="h-9"
            onClick={() => persist(generateSampleRuntime())}
          >
            Cargar ejemplo
          </Button>
        </div>
      </div>
      <Card className="p-4 sm:p-6">
        <RuntimeEditor key={version} value={runtime} onChange={persist} />
      </Card>
    </div>
  )
}
