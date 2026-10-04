// src/app/api/auth/logout/route.ts
// Encerra a sessão (apaga o cookie; o client limpa o token do localStorage).

import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
