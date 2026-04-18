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
    <div className="rounded-3xl border border-red-200/80 bg-gradient-to-br from-red-50/90 to-white p-6 shadow-lg shadow-red-500/10 backdrop-blur-sm sm:p-8">
      <p className="text-sm font-semibold text-red-800">Ocurrió un error inesperado.</p>
      <p className="mt-2 text-sm text-red-600/90">{error.message}</p>
      <Button className="mt-5" onClick={reset}>
        Reintentar
      </Button>
    </div>
  )
}
