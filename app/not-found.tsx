import Link from "next/link"

import { AppPageHeader } from "@/components/app/app-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const NotFound = () => {
  return (
    <div className="space-y-8">
      <AppPageHeader eyebrow="404" title="Página no encontrada" description="La ruta que intentaste abrir no existe o ya no está disponible." />
      <Card className="landing-card-hover mx-auto max-w-xl border-white/90 p-8 text-center">
        <Link href="/dashboard">
          <Button>Volver al panel</Button>
        </Link>
      </Card>
    </div>
  )
}

export default NotFound
