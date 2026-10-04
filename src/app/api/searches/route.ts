// src/app/api/searches/route.ts
// GET: buscas recentes do tenant (pra reabrir resultados).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)

    const searches = await db.search.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        niche: true,
        location: true,
        country: true,
        status: true,
        totalFound: true,
        duplicates: true,
        enriched: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ searches })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
