// src/app/api/plans/route.ts
// Planos ativos — público (usado pela UI de billing e pela landing).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toPlanDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const plans = await db.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { priceCents: 'asc' }],
  })
  return NextResponse.json({ plans: plans.map(toPlanDTO) })
}
