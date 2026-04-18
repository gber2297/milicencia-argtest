import { NextResponse } from "next/server"
import { z } from "zod"

import { publicRedirectUrl } from "@/lib/public-url"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Contrasena invalida"),
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const redirectRaw = formData.get("redirect")
  const redirectTo =
    typeof redirectRaw === "string" && redirectRaw.startsWith("/") && !redirectRaw.startsWith("//")
      ? redirectRaw
      : ""

  const payload = schema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  })
  if (!payload.success) {
    return NextResponse.redirect(publicRedirectUrl(request, "/login?error=Credenciales invalidas"))
  }

  const { email, password } = payload.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(publicRedirectUrl(request, `/login?error=${encodeURIComponent(error.message)}`))
  }

  if (redirectTo) {
    return NextResponse.redirect(publicRedirectUrl(request, redirectTo))
  }

  return NextResponse.redirect(publicRedirectUrl(request, "/dashboard"))
}
