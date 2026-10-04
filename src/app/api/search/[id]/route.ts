// src/app/api/search/[id]/route.ts
// GET: snapshot de uma busca (reabrir buscas recentes).
// DELETE: cancelamento — AbortSignal propagado até os providers.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { cancelSearch } from '@/core/orchestrator'
import { buildSnapshot } from '@/core/search-snapshot'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireUser(request)

    const built = await buildSnapshot(id, user.tenantId)
    if (!built) return NextResponse.json({ error: 'não encontrada' }, { status: 404 })
    return NextResponse.json(built.snapshot)
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireUser(request)

    const search = await db.search.findFirst({ where: { id, tenantId: user.tenantId } })
    if (!search) return NextResponse.json({ error: 'não encontrada' }, { status: 404 })

    await cancelSearch(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
