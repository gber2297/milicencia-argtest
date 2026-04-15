"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm font-medium text-red-700">Ocurrio un error inesperado.</p>
      <p className="mt-1 text-sm text-red-600">{error.message}</p>
      <Button className="mt-3" onClick={reset}>
        Reintentar
      </Button>
    </div>
  )
}
