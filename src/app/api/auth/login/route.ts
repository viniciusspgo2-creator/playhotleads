// src/app/api/auth/login/route.ts
// Login com e-mail/senha. Sessão em cookie httpOnly + token no body
// (fallback localStorage p/ ambientes que bloqueiam cookies).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ensureSeed, sessionCookieOptions, SESSION_COOKIE, signSession, verifyPassword } from '@/lib/auth'
import { toUserDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(72),
})

export async function POST(request: Request) {
  try {
    await ensureSeed()
    const json: unknown = await request.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'e-mail ou senha inválidos' }, { status: 400 })
    }
    const { email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email },
      include: { plan: { select: { name: true } } },
    })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'e-mail ou senha incorretos' }, { status: 401 })
    }
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'conta bloqueada — fale com o suporte' }, { status: 403 })
    }

    const token = signSession(user.id, user.role)
    const res = NextResponse.json({ token, user: toUserDTO(user) })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
