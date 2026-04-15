import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const NotFound = () => {
  return (
    <Card className="mx-auto max-w-xl space-y-3 text-center">
      <h1 className="text-2xl font-semibold">Pagina no encontrada</h1>
      <p className="text-sm text-zinc-600">La ruta que intentaste abrir no existe o ya no esta disponible.</p>
      <div>
        <Link href="/dashboard">
          <Button>Volver al dashboard</Button>
        </Link>
      </div>
    </Card>
  )
}

export default NotFound
