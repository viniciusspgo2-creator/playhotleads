// src/app/api/leads/[id]/route.ts
// PATCH: mover no Kanban, status de contato, nota — tudo tenant-scoped.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { toLeadDTO } from '@/core/dto'
import { KANBAN_STAGES } from '@/core/types'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  kanbanStage: z.enum(KANBAN_STAGES as [string, ...string[]]).optional(),
  contactStatus: z.enum(['ok', 'waiting', 'not_interested']).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireUser(request)

    const json: unknown = await request.json()
    const parsed = PatchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'payload inválido' }, { status: 400 })
    }

    const existing = await db.lead.findFirst({ where: { id, tenantId: user.tenantId } })
    if (!existing) return NextResponse.json({ error: 'não encontrado' }, { status: 404 })

    const updated = await db.lead.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ lead: toLeadDTO(updated) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
