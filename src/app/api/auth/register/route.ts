// src/app/api/auth/register/route.ts
// Cadastro de usuário SaaS: cria tenant + User com créditos de boas-vindas
// (config.defaultFreeCredits) e já devolve a sessão.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { db } from '@/lib/db'
import { ensureTenant } from '@/lib/tenant'
import { ensureSeed, hashPassword, sessionCookieOptions, SESSION_COOKIE, signSession } from '@/lib/auth'
import { getAppConfig } from '@/core/appconfig'
import { toUserDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(72),
})

export async function POST(request: Request) {
  try {
    await ensureSeed()
    const config = await getAppConfig()
    if (!config.signupEnabled) {
      return NextResponse.json({ error: 'cadastros temporariamente desativados' }, { status: 403 })
    }

    const json: unknown = await request.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'dados inválidos', issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      )
    }
    const { name, email, password } = parsed.data

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'este e-mail já está cadastrado' }, { status: 409 })
    }

    // 1 usuário = 1 tenant (workspace isolado com settings próprios)
    const tenant = await ensureTenant(`user-${randomBytes(8).toString('hex')}`)
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        credits: config.defaultFreeCredits,
        tenantId: tenant.id,
      },
      include: { plan: { select: { name: true } } },
    })

    const token = signSession(user.id, user.role)
    const res = NextResponse.json({ token, user: toUserDTO(user) }, { status: 201 })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
