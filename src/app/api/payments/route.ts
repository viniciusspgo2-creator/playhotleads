// src/app/api/payments/route.ts
// Histórico de pagamentos do usuário logado.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { toPaymentDTO } from '@/core/billing'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    const payments = await db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    })
    return NextResponse.json({ payments: payments.map(toPaymentDTO) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
