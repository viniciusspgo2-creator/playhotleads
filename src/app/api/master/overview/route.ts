// src/app/api/master/overview/route.ts
// GET: métricas agregadas do SaaS inteiro (usuários, buscas, leads, receita)
// + últimos pagamentos e usuários — alimenta a seção "Visão geral" do painel
// master. Acesso restrito à role master (requireMaster).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireMaster } from '@/lib/auth'
import { toPaymentDTO } from '@/core/billing'
import { toUserDTO } from '@/core/dto'
import type { MasterOverviewDTO } from '@/core/types'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(request: Request) {
  try {
    await requireMaster(request)

    const now = Date.now()
    const d7 = new Date(now - 7 * DAY_MS)
    const d24 = new Date(now - DAY_MS)
    const d30 = new Date(now - 30 * DAY_MS)

    const [
      usersTotal,
      usersBlocked,
      usersNew7d,
      creditsAgg,
      searchesTotal,
      searches24h,
      leadsTotal,
      paidAgg,
      last30dAgg,
      pendingAgg,
      recentPaymentsRaw,
      recentUsersRaw,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: 'blocked' } }),
      db.user.count({ where: { createdAt: { gte: d7 } } }),
      db.user.aggregate({ _sum: { credits: true } }),
      db.search.count(),
      db.search.count({ where: { createdAt: { gte: d24 } } }),
      db.lead.count(),
      db.payment.aggregate({
        where: { status: 'paid' },
        _count: { _all: true },
        _sum: { amountCents: true },
      }),
      db.payment.aggregate({
        where: { status: 'paid', paidAt: { gte: d30 } },
        _sum: { amountCents: true },
      }),
      db.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amountCents: true },
      }),
      db.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { name: true, email: true } } },
      }),
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { plan: { select: { name: true } } },
      }),
    ])

    const overview: MasterOverviewDTO = {
      users: {
        total: usersTotal,
        blocked: usersBlocked,
        newLast7d: usersNew7d,
        outstandingCredits: creditsAgg._sum.credits ?? 0,
      },
      searches: { total: searchesTotal, last24h: searches24h },
      leads: { total: leadsTotal },
      revenue: {
        paidCount: paidAgg._count._all,
        totalCents: paidAgg._sum.amountCents ?? 0,
        last30dCents: last30dAgg._sum.amountCents ?? 0,
        pendingCents: pendingAgg._sum.amountCents ?? 0,
      },
      recentPayments: recentPaymentsRaw.map(toPaymentDTO),
      recentUsers: recentUsersRaw.map(toUserDTO),
    }

    return NextResponse.json({ overview })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
