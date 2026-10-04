// src/app/api/leads/route.ts
// GET: lista com filtros (tenant-scoped sempre).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { toLeadDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    const url = new URL(request.url)

  const stage = url.searchParams.get('stage') ?? undefined
  const country = url.searchParams.get('country') ?? undefined
  const searchId = url.searchParams.get('searchId') ?? undefined
  const q = url.searchParams.get('q') ?? undefined
  const source = url.searchParams.get('source') ?? undefined
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get('pageSize') ?? '50') || 50))

  // filtro por fonte: JSON string[] no SQLite — filtramos em memória no slice
  const where = {
    tenantId: user.tenantId,
    ...(stage ? { kanbanStage: stage } : {}),
    ...(country ? { country } : {}),
    ...(searchId ? { searchId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { domain: { contains: q } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize * 3, // margem pro filtro de fonte in-memory
      skip: (page - 1) * pageSize,
    }),
  ])

  let leads = rows.map(toLeadDTO)
  if (source) leads = leads.filter((l) => l.sources.includes(source as never))
  leads = leads.slice(0, pageSize)

  return NextResponse.json({ leads, total, page, pageSize })
} catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
