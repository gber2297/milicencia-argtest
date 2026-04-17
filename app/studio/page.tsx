import type { Metadata } from "next"

import { StudioWorkspace } from "@/components/studio/studio-workspace"

export const metadata: Metadata = {
  title: "Video Studio | MiLicencia",
  description: "Generador de videos verticales 9:16 para redes sociales",
}

export default function StudioPage() {
  return <StudioWorkspace />
}
