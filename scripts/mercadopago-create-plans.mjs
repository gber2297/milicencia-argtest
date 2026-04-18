/**
 * Crea dos planes de suscripción en Mercado Pago (preapproval_plan): semanal y mensual.
 *
 * Requisitos en .env.local (no commitear):
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...   (credencial de prueba o producción)
 *
 * Opcional:
 *   MERCADOPAGO_PLAN_AMOUNT_WEEKLY=4990
 *   MERCADOPAGO_PLAN_AMOUNT_MONTHLY=8990
 *   MERCADOPAGO_PLAN_BACK_URL=https://tu-dominio.com/pricing
 *     (si falta: APP_URL o NEXT_PUBLIC_APP_URL o http://localhost:3000/pricing)
 *
 * Uso: npm run mp:create-plans
 */

import { config } from "dotenv"
import { resolve } from "node:path"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()
if (!token) {
  console.error("Falta MERCADOPAGO_ACCESS_TOKEN en .env.local")
  process.exit(1)
}

const amountWeekly = Number(process.env.MERCADOPAGO_PLAN_AMOUNT_WEEKLY ?? "4990")
const amountMonthly = Number(process.env.MERCADOPAGO_PLAN_AMOUNT_MONTHLY ?? "8990")

const backUrlRaw =
  process.env.MERCADOPAGO_PLAN_BACK_URL?.trim() ||
  process.env.APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000"
const backUrl = backUrlRaw.replace(/\/$/, "") + "/pricing"

async function createPlan(body) {
  const res = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

function planBodyWeekly() {
  return {
    reason: "Mi Licencia — plan semanal",
    auto_recurring: {
      frequency: 7,
      frequency_type: "days",
      transaction_amount: amountWeekly,
      currency_id: "ARS",
    },
    payment_methods_allowed: {
      payment_types: [{}],
      payment_methods: [{}],
    },
    back_url: backUrl,
  }
}

function planBodyMonthly() {
  return {
    reason: "Mi Licencia — plan mensual",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: amountMonthly,
      currency_id: "ARS",
    },
    payment_methods_allowed: {
      payment_types: [{}],
      payment_methods: [{}],
    },
    back_url: backUrl,
  }
}

console.log("back_url usado en los planes:", backUrl)
console.log("Montos ARS — semanal:", amountWeekly, "| mensual:", amountMonthly)
console.log("")

const weekly = await createPlan(planBodyWeekly())
if (!weekly.ok) {
  console.error("Error creando plan SEMANAL:", weekly.status, JSON.stringify(weekly.data, null, 2))
  process.exit(1)
}

const monthly = await createPlan(planBodyMonthly())
if (!monthly.ok) {
  console.error("Error creando plan MENSUAL:", monthly.status, JSON.stringify(monthly.data, null, 2))
  process.exit(1)
}

const idWeek = weekly.data.id
const idMonth = monthly.data.id

console.log("Listo. Copiá estos IDs a .env.local / Vercel:")
console.log("")
console.log(`MERCADOPAGO_PREAPPROVAL_PLAN_ID_WEEKLY=${idWeek}`)
console.log(`MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY=${idMonth}`)
console.log("")
console.log("Luego: NEXT_PUBLIC_MERCADOPAGO_SUBSCRIPTIONS_API=true (y credenciales Supabase para webhooks).")
