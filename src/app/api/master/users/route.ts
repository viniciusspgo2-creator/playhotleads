// src/app/api/master/users/route.ts
// GET: lista paginada de TODOS os usuários do SaaS (busca por nome/e-mail)
// com contadores de uso (buscas + leads por tenant) — painel master.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireMaster } from '@/lib/auth'
import { toUserDTO } from '@/core/dto'
import type { MasterUserRow } from '@/core/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireMaster(request)

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20))

    const where = q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
      : {}

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { plan: { select: { name: true } } },
      }),
      db.user.count({ where }),
    ])

    const tenantIds = users.map((u) => u.tenantId)
    const searchGroups = tenantIds.length
      ? await db.search.groupBy({
          by: ['tenantId'],
          _count: { _all: true },
          where: { tenantId: { in: tenantIds } },
        })
      : []
    const leadGroups = tenantIds.length
      ? await db.lead.groupBy({
          by: ['tenantId'],
          _count: { _all: true },
          where: { tenantId: { in: tenantIds } },
        })
      : []

    const searchMap = new Map<string, number>(searchGroups.map((g) => [g.tenantId, g._count._all]))
    const leadMap = new Map<string, number>(leadGroups.map((g) => [g.tenantId, g._count._all]))

    const rows: MasterUserRow[] = users.map((u) => ({
      ...toUserDTO(u),
      searchesCount: searchMap.get(u.tenantId) ?? 0,
      leadsCount: leadMap.get(u.tenantId) ?? 0,
    }))

    return NextResponse.json({ rows, total, page, pageSize })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
