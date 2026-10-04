// src/app/api/master/payments/route.ts
// GET: lista paginada de TODOS os pagamentos do SaaS com filtros por status
// e busca por usuário (nome/e-mail). Alimenta a moderação de cobranças no
// painel master.

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { authErrorResponse, requireMaster } from '@/lib/auth'
import { toPaymentDTO } from '@/core/billing'
import type { PaymentStatus } from '@/core/types'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: readonly PaymentStatus[] = ['pending', 'paid', 'failed', 'expired']

export async function GET(request: Request) {
  try {
    await requireMaster(request)

    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20))
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120)
    const statusParam = url.searchParams.get('status')
    const status = statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as PaymentStatus)
      : undefined

    const where: Prisma.PaymentWhereInput = {}
    if (status) where.status = status

    if (q) {
      const matched = await db.user.findMany({
        where: { OR: [{ name: { contains: q } }, { email: { contains: q } }] },
        select: { id: true },
        take: 200,
      })
      if (matched.length === 0) {
        return NextResponse.json({ rows: [], total: 0, page, pageSize })
      }
      where.userId = { in: matched.map((u) => u.id) }
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({ rows: payments.map(toPaymentDTO), total, page, pageSize })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
