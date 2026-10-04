// src/app/api/master/payments/[id]/route.ts
// PATCH: moderação manual de um pagamento — 'approve' concede créditos de
// forma idempotente (approvePayment) e 'fail' marca falha. 404 se ausente.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authErrorResponse, requireMaster } from '@/lib/auth'
import { approvePayment, failPayment, toPaymentDTO } from '@/core/billing'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  action: z.enum(['approve', 'fail']),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster(request)
    const { id } = await params

    const json: unknown = await request.json()
    const parsed = PatchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'ação inválida' }, { status: 400 })
    }

    const existing = await db.payment.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'pagamento não encontrado' }, { status: 404 })

    const applied =
      parsed.data.action === 'approve'
        ? await approvePayment(id, 'manual')
        : await failPayment(id)
    if (!applied) return NextResponse.json({ error: 'pagamento não encontrado' }, { status: 404 })

    const payment = await db.payment.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    })
    if (!payment) return NextResponse.json({ error: 'pagamento não encontrado' }, { status: 404 })

    return NextResponse.json({ payment: toPaymentDTO(payment) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
