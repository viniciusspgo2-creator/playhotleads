// src/app/api/payments/[id]/route.ts
// Status de um pagamento (polling da UI). Pendente com externalId consulta
// o gateway — se aprovado lá, concede créditos aqui (idempotente).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { syncPaymentStatus, toPaymentDTO } from '@/core/billing'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request)
    const { id } = await ctx.params

    const payment = await db.payment.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    })
    if (!payment || (payment.userId !== user.id && user.role !== 'master')) {
      return NextResponse.json({ error: 'pagamento não encontrado' }, { status: 404 })
    }

    const synced = await syncPaymentStatus(payment)
    return NextResponse.json({ payment: toPaymentDTO(synced) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
