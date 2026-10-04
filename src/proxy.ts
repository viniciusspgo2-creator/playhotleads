// src/proxy.ts  (Next 16: "middleware" foi renomeado para "proxy")
// Emite/renova o cookie de tenant. Self-contained de propósito — sem prisma aqui.
//
// Terceira camada de robustez: o cookie usa SameSite=None + Secure +
// Partitioned (CHIPS) para sobreviver em iframes cross-site (preview do
// builder). Se o browser bloquear até cookies particionados (Safari), o
// client envia o header x-tenant-id — espelhado aqui no cookie na 1ª chance.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TENANT_COOKIE, TENANT_COOKIE_VISIBLE, TENANT_HEADER, isValidTenantId } from '@/lib/tenant-constants'

const ONE_YEAR = 60 * 60 * 24 * 365

export function proxy(request: NextRequest) {
  // prioridade: header válido (identidade durável do localStorage — mesma
  // fonte do ?tid= do EventSource, garante consistência fetch↔SSE) → cookie
  // válido → mint novo. O cookie é regravado no valor escolhido = convergência.
  const fromCookie = request.cookies.get(TENANT_COOKIE)?.value
  const fromHeader = request.headers.get(TENANT_HEADER)

  const tenantId = isValidTenantId(fromHeader)
    ? fromHeader
    : isValidTenantId(fromCookie)
      ? fromCookie
      : crypto.randomUUID()

  const response = NextResponse.next()

  const options = {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    partitioned: true,
    maxAge: ONE_YEAR,
    path: '/',
  } as const

  response.cookies.set(TENANT_COOKIE, tenantId, options)
  // espelho legível por JS — fallback pro client quando localStorage vazio
  response.cookies.set(TENANT_COOKIE_VISIBLE, tenantId, { ...options, httpOnly: false })

  return response
}

export const config = {
  matcher: ['/', '/api/:path*'],
}
