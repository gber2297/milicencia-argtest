import { NextResponse } from "next/server"
import { z } from "zod"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { publicRedirectUrl } from "@/lib/public-url"

const schema = z.object({
  fullName: z.string().min(2, "Nombre invalido"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
})

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

  const supabase = await createClient()
  let { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (error) {
    const isEmailDeliveryIssue = error.message
      .toLowerCase()
      .includes("error sending confirmation email")

    if (!isEmailDeliveryIssue) {
      return NextResponse.redirect(
        publicRedirectUrl(request, `/register?error=${encodeURIComponent(error.message)}`),
      )
    }

    const admin = createAdminClient()
    const { data: adminData, error: adminError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (adminError || !adminData.user) {
      return NextResponse.redirect(
        publicRedirectUrl(
          request,
          `/register?error=${encodeURIComponent(adminError?.message ?? "No se pudo crear la cuenta")}`,
        ),
      )
    }

    data = { ...data, user: adminData.user }
    error = null

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return NextResponse.redirect(
        new URL("/login?error=Cuenta creada. Inicia sesion para continuar.", request.url),
      )
    }
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      role: "user",
    })
  }

  return NextResponse.redirect(publicRedirectUrl(request, "/onboarding"))
}
