import Link from "next/link"

import { redirectIfAuthenticated } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>
}

const RegisterPage = async ({ searchParams }: RegisterPageProps) => {
  await redirectIfAuthenticated()
  const params = await searchParams

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <form action="/auth/register" method="post" className="space-y-3">
        <Input name="fullName" placeholder="Nombre y apellido" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Contrasena" minLength={6} required />
        <Button className="w-full">Registrarme</Button>
      </form>
      {params.error && <p className="text-sm text-red-600">{params.error}</p>}
      <p className="text-sm text-zinc-600">
        Ya tenes cuenta? <Link href="/login" className="text-blue-600">Ingresar</Link>
      </p>
    </Card>
  )
}

export default RegisterPage
