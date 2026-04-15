import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Contrasena invalida"),
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const payload = schema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  })
  if (!payload.success) {
    return NextResponse.redirect(new URL("/login?error=Credenciales invalidas", request.url))
  }

  const { email, password } = payload.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
