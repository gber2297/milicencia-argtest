import Link from "next/link"

import { AppPageHeader } from "@/components/app/app-page-header"
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
    <div className="space-y-8">
      <AppPageHeader eyebrow="Cuenta nueva" title="Crear cuenta" description="Completá tus datos para guardar progreso y preferencias." />
      <Card className="landing-card-hover mx-auto w-full max-w-md border-white/90 p-6 sm:p-8">
        <form action="/auth/register" method="post" className="space-y-4">
          <Input name="fullName" placeholder="Nombre y apellido" required className="rounded-2xl border-zinc-200/90 bg-white/80" />
          <Input name="email" type="email" placeholder="Email" required className="rounded-2xl border-zinc-200/90 bg-white/80" />
          <Input
            name="password"
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            minLength={6}
            required
            className="rounded-2xl border-zinc-200/90 bg-white/80"
          />
          <Button type="submit" className="mt-2 w-full">
            Registrarme
          </Button>
        </form>
        {params.error && <p className="text-sm text-red-600">{params.error}</p>}
        <p className="mt-4 text-center text-sm text-zinc-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">
            Ingresar
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default RegisterPage
