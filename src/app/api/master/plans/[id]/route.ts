// src/app/api/master/plans/[id]/route.ts
// PATCH: edição parcial de plano. DELETE: exclusão — bloqueada quando o plano
// tem usuários ou pagamentos vinculados (409 → master deve desativar).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { authErrorResponse, requireMaster } from '@/lib/auth'
import { toPlanDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  priceCents: z.number().int().min(0).optional(),
  credits: z.number().int().min(0).optional(),
  features: z
    .array(z.string().trim().max(80))
    .max(8)
    .transform((arr) => arr.filter((s) => s.length > 0))
    .optional(),
  active: z.boolean().optional(),
  highlight: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster(request)
    const { id } = await params

    const json: unknown = await request.json()
    const parsed = PatchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'dados do plano inválidos' }, { status: 400 })
    }
    const patch = parsed.data

    const existing = await db.plan.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'plano não encontrado' }, { status: 404 })

    const data: {
      name?: string
      priceCents?: number
      credits?: number
      features?: string
      active?: boolean
      highlight?: boolean
      sortOrder?: number
    } = {}
    if (patch.name !== undefined) data.name = patch.name
    if (patch.priceCents !== undefined) data.priceCents = patch.priceCents
    if (patch.credits !== undefined) data.credits = patch.credits
    if (patch.features !== undefined) data.features = JSON.stringify(patch.features)
    if (patch.active !== undefined) data.active = patch.active
    if (patch.highlight !== undefined) data.highlight = patch.highlight
    if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'nada para atualizar' }, { status: 400 })
    }

    let plan
    try {
      plan = await db.plan.update({ where: { id }, data })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return NextResponse.json({ error: 'já existe um plano com esse nome' }, { status: 409 })
      }
      throw err
    }

    return NextResponse.json({ plan: toPlanDTO(plan) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster(request)
    const { id } = await params

    const plan = await db.plan.findUnique({
      where: { id },
      include: { _count: { select: { users: true, payments: true } } },
    })
    if (!plan) return NextResponse.json({ error: 'plano não encontrado' }, { status: 404 })

    if (plan._count.users > 0 || plan._count.payments > 0) {
      return NextResponse.json(
        { error: 'plano em uso — desative-o em vez de excluir' },
        { status: 409 },
      )
    }

    await db.plan.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
