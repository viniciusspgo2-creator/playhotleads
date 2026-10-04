// src/lib/auth.ts
// Autenticação do SaaS: senha scrypt + sessão JWT HS256 (cookie httpOnly
// SameSite=None/Secure/Partitioned — sobrevive em iframe — com fallback
// header x-session-token, mesma estratégia do tenant).
// requireUser/requireMaster são a porta de TODA rota autenticada.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'
import { sessionSecret } from '@/core/crypto'
import { ensureTenant } from '@/lib/tenant'
import type { User } from '@prisma/client'
import type { UserRole } from '@/core/types'

export const SESSION_COOKIE = 'phl_session'
export const SESSION_HEADER = 'x-session-token'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 dias

const MASTER_EMAIL = (process.env.PHL_MASTER_EMAIL ?? 'master@playhotleads.com').toLowerCase()
// Senha padrão SÓ existe fora de produção. Em produção o master só é criado
// se PHL_MASTER_PASSWORD estiver definida (nunca há credencial no código).
const MASTER_PASSWORD =
  process.env.PHL_MASTER_PASSWORD ?? (process.env.NODE_ENV === 'production' ? '' : 'playmaster2026')

/* ------------------------------------------------------------------ */
/* Senhas — scrypt com salt aleatório                                   */
/* ------------------------------------------------------------------ */

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `${salt.toString('base64')}.${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltB64, hashB64] = stored.split('.')
  if (!saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/* ------------------------------------------------------------------ */
/* Sessão — JWT HS256 feito à mão (zero dependência, Edge-free)         */
/* ------------------------------------------------------------------ */

interface SessionPayload {
  sub: string
  role: UserRole
  exp: number
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

/**
 * Assina a sessão. O `role` vem do Prisma como `string` — normalizamos aqui
 * (guard explícito) para que TODO call site fique type-safe sem casts.
 */
export function signSession(userId: string, role: string): string {
  const normalizedRole: UserRole = role === 'master' ? 'master' : 'user'
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload: SessionPayload = {
    sub: userId,
    role: normalizedRole,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac('sha256', sessionSecret()).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const expected = createHmac('sha256', sessionSecret()).update(`${header}.${body}`).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.sub || payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

/** Opções do cookie de sessão — third-party-safe (preview em iframe). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    partitioned: true,
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  } as const
}

/* ------------------------------------------------------------------ */
/* Resolução de usuário — header > cookie > ?token= (EventSource)        */
/* ------------------------------------------------------------------ */

export class AuthError extends Error {
  readonly status: 401 | 403
  constructor(message: string, status: 401 | 403 = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

async function readSessionToken(request?: Request): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const fromCookie = store.get(SESSION_COOKIE)?.value ?? null
  if (fromCookie) return fromCookie

  const { headers } = await import('next/headers')
  const hdrs = await headers()
  const fromHeader = hdrs.get(SESSION_HEADER)
  if (fromHeader) return fromHeader

  // EventSource não envia headers — fallback ?token= (mesma estratégia do tid)
  if (request) {
    const t = new URL(request.url).searchParams.get('token')
    if (t) return t
  }
  return null
}

export type AuthedUser = User & { planName: string | null }

/** Usuário autenticado ou null — para rotas que aceitam anônimo. */
export async function getAuthUser(request?: Request): Promise<AuthedUser | null> {
  const token = await readSessionToken(request)
  if (!token) return null
  const payload = verifySessionToken(token)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    include: { plan: { select: { name: true } } },
  })
  if (!user || user.status !== 'active') return null
  return { ...user, planName: user.plan?.name ?? null }
}

/** Exige sessão válida e conta ativa — caso contrário AuthError. */
export async function requireUser(request?: Request): Promise<AuthedUser> {
  const user = await getAuthUser(request)
  if (!user) throw new AuthError('não autenticado — faça login', 401)
  return user
}

/** Exige role master (painel administrativo). */
export async function requireMaster(request?: Request): Promise<AuthedUser> {
  const user = await requireUser(request)
  if (user.role !== 'master') throw new AuthError('acesso restrito ao master', 403)
  return user
}

/** Converte AuthError em resposta JSON padronizada. */
export function authErrorResponse(err: unknown): { body: { error: string }; status: number } | null {
  if (err instanceof AuthError) {
    return { body: { error: err.message }, status: err.status }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Seed — master + planos default (idempotente, roda nas rotas de auth) */
/* ------------------------------------------------------------------ */

const DEFAULT_PLANS = [
  {
    name: 'Free',
    priceCents: 0,
    credits: 150,
    features: JSON.stringify(['150 créditos grátis', '5 fontes gratuitas', 'Kanban + WhatsApp', 'Enriquecimento por crawl']),
    highlight: false,
    sortOrder: 0,
  },
  {
    name: 'Pro',
    priceCents: 9700,
    credits: 5000,
    features: JSON.stringify(['5.000 créditos', 'Todas as fontes + BYOK', 'Busca global (8 países)', 'Export de leads', 'Suporte prioritário']),
    highlight: true,
    sortOrder: 1,
  },
  {
    name: 'Business',
    priceCents: 29700,
    credits: 20000,
    features: JSON.stringify(['20.000 créditos', 'Volume alto com proxy', 'Onboarding dedicado', 'SLA de suporte', 'Faturamento mensal']),
    highlight: false,
    sortOrder: 2,
  },
]

let seeded = false

export async function ensureSeed(): Promise<void> {
  if (seeded) return

  const userCount = await db.user.count()
  if (userCount === 0 && !MASTER_PASSWORD) {
    console.error('[auth] PHL_MASTER_PASSWORD não definida em produção — conta master NÃO criada')
  } else if (userCount === 0) {
    // master — credenciais vêm do ambiente (produção) ou do padrão de dev
    const tenant = await ensureTenant(`master-${randomBytes(8).toString('hex')}`)
    await db.user.create({
      data: {
        email: MASTER_EMAIL,
        passwordHash: hashPassword(MASTER_PASSWORD),
        name: 'Master',
        role: 'master',
        credits: 999999,
        tenantId: tenant.id,
      },
    })
    console.log(`[auth] master seed criado: ${MASTER_EMAIL}`)
  }

  const planCount = await db.plan.count()
  if (planCount === 0) {
    await db.plan.createMany({ data: DEFAULT_PLANS })
  }

  seeded = true
}
