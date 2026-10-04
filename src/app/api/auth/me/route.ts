// src/app/api/auth/me/route.ts
// GET: usuário da sessão + plano (a UI chama ao montar e a cada evento de
// créditos). PATCH: troca de nome e/ou senha (exige senha atual).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authErrorResponse, hashPassword, requireUser, verifyPassword } from '@/lib/auth'
import { toUserDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    return NextResponse.json({ user: toUserDTO(user) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

const PatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  currentPassword: z.string().max(72).optional(),
  newPassword: z.string().min(8).max(72).optional(),
})

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request)
    const json: unknown = await request.json()
    const parsed = PatchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'dados inválidos' }, { status: 400 })
    }
    const { name, currentPassword, newPassword } = parsed.data

    const data: { name?: string; passwordHash?: string } = {}
    if (name) data.name = name
    if (newPassword) {
      const full = await db.user.findUnique({ where: { id: user.id } })
      if (!full || !currentPassword || !verifyPassword(currentPassword, full.passwordHash)) {
        return NextResponse.json({ error: 'senha atual incorreta' }, { status: 403 })
      }
      data.passwordHash = hashPassword(newPassword)
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'nada para atualizar' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      include: { plan: { select: { name: true } } },
    })
    return NextResponse.json({ user: toUserDTO(updated) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
