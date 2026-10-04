// src/app/api/master/users/[id]/route.ts
// PATCH: edição completa de um usuário pelo master (nome, e-mail, créditos,
// plano, status, papel, nova senha). DELETE: exclusão do usuário (cascade no
// tenant → busca/leads somem juntos). Auto-proteção: o master não pode mudar
// o próprio role/status nem se excluir.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { authErrorResponse, hashPassword, requireMaster } from '@/lib/auth'
import { toUserDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(120).optional(),
  credits: z.number().int().min(0).max(1_000_000).optional(),
  planId: z.string().min(1).nullable().optional(),
  status: z.enum(['active', 'blocked']).optional(),
  role: z.enum(['user', 'master']).optional(),
  newPassword: z.string().min(8).max(72).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const master = await requireMaster(request)
    const { id } = await params

    const json: unknown = await request.json()
    const parsed = PatchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'dados inválidos' }, { status: 400 })
    }
    const patch = parsed.data

    const target = await db.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'usuário não encontrado' }, { status: 404 })

    // Auto-proteção: sem rebaixar/mudar papel e sem se bloquear.
    if (id === master.id && ((patch.role !== undefined && patch.role !== target.role) || patch.status === 'blocked')) {
      return NextResponse.json(
        { error: 'não é possível alterar role/status da própria conta' },
        { status: 400 },
      )
    }

    if (patch.planId) {
      const plan = await db.plan.findUnique({ where: { id: patch.planId }, select: { id: true } })
      if (!plan) return NextResponse.json({ error: 'plano inexistente' }, { status: 400 })
    }

    const data: {
      name?: string
      email?: string
      credits?: number
      planId?: string | null
      status?: string
      role?: string
      passwordHash?: string
    } = {}
    if (patch.name !== undefined) data.name = patch.name
    if (patch.email !== undefined) data.email = patch.email
    if (patch.credits !== undefined) data.credits = patch.credits
    if (patch.planId !== undefined) data.planId = patch.planId
    if (patch.status !== undefined) data.status = patch.status
    if (patch.role !== undefined) data.role = patch.role
    if (patch.newPassword) data.passwordHash = hashPassword(patch.newPassword)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'nada para atualizar' }, { status: 400 })
    }

    let updated
    try {
      updated = await db.user.update({
        where: { id },
        data,
        include: { plan: { select: { name: true } } },
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return NextResponse.json({ error: 'e-mail já em uso' }, { status: 409 })
      }
      throw err
    }

    return NextResponse.json({ user: toUserDTO(updated) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const master = await requireMaster(request)
    const { id } = await params

    if (id === master.id) {
      return NextResponse.json({ error: 'não é possível excluir a própria conta' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id }, select: { id: true } })
    if (!target) return NextResponse.json({ error: 'usuário não encontrado' }, { status: 404 })

    await db.user.delete({ where: { id } }) // cascade: tenant → buscas/leads
    return NextResponse.json({ ok: true })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
