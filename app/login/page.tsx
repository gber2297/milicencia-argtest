import Link from "next/link"

import { AppPageHeader } from "@/components/app/app-page-header"
import { redirectIfAuthenticated } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface LoginPageProps {
  searchParams: Promise<{ error?: string; redirect?: string }>
}

function safeInternalRedirect(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return ""
  return raw
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  await redirectIfAuthenticated()
  const params = await searchParams
  const afterLogin = safeInternalRedirect(params.redirect)

  return (
    <div className="space-y-8">
      <AppPageHeader eyebrow="Acceso" title="Ingresar" description="Entrá con tu email y contraseña." />
      <Card className="landing-card-hover mx-auto w-full max-w-md border-white/90 p-6 sm:p-8">
        <form action="/auth/login" method="post" className="space-y-4">
          {afterLogin ? <input type="hidden" name="redirect" value={afterLogin} /> : null}
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-2xl border-zinc-200/90 bg-white/80"
          />
          <Input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            className="rounded-2xl border-zinc-200/90 bg-white/80"
          />
          <Button type="submit" className="mt-2 w-full">
            Entrar
          </Button>
        </form>
        {params.error && <p className="text-sm text-red-600">{params.error}</p>}
        <p className="mt-4 text-center text-sm text-zinc-600">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-semibold text-[var(--brand-blue)] hover:underline">
            Crear cuenta
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default LoginPage
