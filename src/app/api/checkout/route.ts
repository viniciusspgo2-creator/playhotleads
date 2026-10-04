// src/app/api/checkout/route.ts
// Cria a cobrança do plano no método escolhido. Sem credencial de gateway o
// pagamento cai no gateway 'demo' (aprovável na UI) — com credencial usa
// Mercado Pago/Asaas de verdade.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { createPaymentForUser } from '@/core/billing'
import { toPaymentDTO } from '@/core/billing'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  planId: z.string().min(1).max(40),
  method: z.enum(['pix', 'mercadopago', 'credit_card', 'asaas']),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    const json: unknown = await request.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'plano ou método inválido' }, { status: 400 })
    }

    const plan = await db.plan.findUnique({ where: { id: parsed.data.planId } })
    if (!plan || !plan.active) {
      return NextResponse.json({ error: 'plano indisponível' }, { status: 404 })
    }

    const payment = await createPaymentForUser(user, plan, parsed.data.method)
    const fresh = await db.payment.findUnique({
      where: { id: payment.id },
      include: { user: { select: { name: true, email: true } } },
    })

    return NextResponse.json(
      { payment: toPaymentDTO(fresh ?? payment) },
      { status: 201 },
    )
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return NextResponse.json(auth.body, { status: auth.status })
    const message = err instanceof Error ? err.message : 'erro inesperado'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
