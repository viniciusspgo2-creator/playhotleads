// src/app/api/payments/[id]/simulate/route.ts
// Aprovação simulada — só existe para gateway 'demo' (sandbox do produto,
// quando o master ainda não configurou Mercado Pago/Asaas). Em produção com
// credencial real esta rota devolve 409.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { approvePayment, toPaymentDTO } from '@/core/billing'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request)
    const { id } = await ctx.params

    const payment = await db.payment.findUnique({ where: { id } })
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ error: 'pagamento não encontrado' }, { status: 404 })
    }
    if (payment.gateway !== 'demo') {
      return NextResponse.json(
        { error: 'simulação disponível apenas no modo demo (gateway real configurado)' },
        { status: 409 },
      )
    }

    const approved = await approvePayment(id, 'simulate')
    const fresh = await db.payment.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    })
    return NextResponse.json({ payment: toPaymentDTO(fresh ?? approved ?? payment) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
