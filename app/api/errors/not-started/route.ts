import { NextResponse } from "next/server"

/**
 * Algunas herramientas de desarrollo (p. ej. overlay / integraciones) hacen POST aquí.
 * No forma parte de la lógica de Mi Licencia; evita 404 ruidosos en consola/red.
 */
export async function POST() {
  return new NextResponse(null, { status: 204 })
}
