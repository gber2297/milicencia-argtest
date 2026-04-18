import type { Metadata } from "next"

import { GuestPracticeSession } from "@/components/app/guest-practice-session"

export const metadata: Metadata = {
  title: "Probar una pregunta | MiLicencia Argentina Test",
  description:
    "Respondé una pregunta real del teórico sin registrarte. Después podés crear una cuenta para seguir con tu progreso.",
}

export default function ProbarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Probá el teórico</h1>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          Una pregunta de ejemplo, igual que en la app. El cuestionario de preferencias va después de crear tu cuenta: así
          guardamos tu perfil de estudio.
        </p>
      </div>
      <GuestPracticeSession />
    </div>
  )
}
