import Link from "next/link"

import { redirectIfAuthenticated } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  await redirectIfAuthenticated()
  const params = await searchParams

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <form action="/auth/login" method="post" className="space-y-3">
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Contrasena" required />
        <Button className="w-full">Entrar</Button>
      </form>
      {params.error && <p className="text-sm text-red-600">{params.error}</p>}
      <p className="text-sm text-zinc-600">
        No tenes cuenta? <Link href="/register" className="text-blue-600">Crear cuenta</Link>
      </p>
    </Card>
  )
}

export default LoginPage
