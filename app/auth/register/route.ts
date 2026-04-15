import { NextResponse } from "next/server"
import { z } from "zod"

import { publicRedirectUrl } from "@/lib/public-url"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  fullName: z.string().min(2, "Nombre invalido"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
})

/**
 * Registro sin confirmación por email: creamos el usuario con la service role
 * (`email_confirm: true`) e iniciamos sesión en el mismo request.
 * Requiere `SUPABASE_SERVICE_ROLE_KEY` en el servidor.
 */
export async function POST(request: Request) {
  const formData = await request.formData()
  const payload = schema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  })
  if (!payload.success) {
    return NextResponse.redirect(publicRedirectUrl(request, "/register?error=Datos de registro invalidos"))
  }

  const { fullName, email, password } = payload.data

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError) {
    const msg = createError.message.toLowerCase()
    const duplicate =
      msg.includes("already been registered") ||
      msg.includes("already registered") ||
      msg.includes("user already exists") ||
      createError.status === 422

    if (duplicate) {
      return NextResponse.redirect(
        publicRedirectUrl(
          request,
          "/register?error=" + encodeURIComponent("Ya existe una cuenta con este email. Inicia sesion."),
        ),
      )
    }

    return NextResponse.redirect(
      publicRedirectUrl(request, `/register?error=${encodeURIComponent(createError.message)}`),
    )
  }

  if (!created.user) {
    return NextResponse.redirect(publicRedirectUrl(request, "/register?error=No se pudo crear la cuenta"))
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    return NextResponse.redirect(
      publicRedirectUrl(
        request,
        "/login?error=" + encodeURIComponent("Cuenta creada. Inicia sesion para continuar."),
      ),
    )
  }

  await supabase.from("profiles").upsert({
    id: created.user.id,
    email: created.user.email,
    full_name: fullName,
    role: "user",
  })

  return NextResponse.redirect(publicRedirectUrl(request, "/onboarding"))
}
