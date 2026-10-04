'use client'

// src/lib/tenant-client.ts
// Identidade do tenant no browser + wrapper de fetch que SEMPRE envia o
// header x-tenant-id. Motivo: em previews embutidos em iframe cross-site o
// browser bloqueia cookies de terceiros (SameSite=Lax nem é armazenado) —
// sem o header, toda chamada /api/* volta 500 "tenant ausente".
// Cadeia de fallback do client: localStorage → cookie visível → mint UUID.

import { TENANT_COOKIE_VISIBLE, TENANT_HEADER, isValidTenantId } from './tenant-constants'

const TENANT_LS_KEY = 'phl.tenant'
const SESSION_LS_KEY = 'phl.session'
export const SESSION_HEADER = 'x-session-token'

let cached: string | null = null
let sessionCache: string | null = null

function readVisibleCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    /(?:^|;\s*)phl_tenant_vis=([0-9a-fA-F-]{36})/,
  )
  return match?.[1] ?? null
}

/** UUID v4 com fallback (crypto.randomUUID exige secure context). */
function mintUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[Math.floor(Math.random() * 4)]}${hex(3)}-${hex(12)}`
}

/** Id do tenant deste browser — estável entre sessões (localStorage). */
export function getTenantId(): string {
  if (cached && isValidTenantId(cached)) return cached
  if (typeof window === 'undefined') return ''

  try {
    const ls = window.localStorage.getItem(TENANT_LS_KEY)
    if (isValidTenantId(ls)) {
      cached = ls
      return ls
    }
    const vis = readVisibleCookie()
    if (isValidTenantId(vis)) {
      window.localStorage.setItem(TENANT_LS_KEY, vis)
      cached = vis
      return vis
    }
    const minted = mintUUID()
    window.localStorage.setItem(TENANT_LS_KEY, minted)
    cached = minted
    return minted
  } catch {
    // localStorage/cookie bloqueados (modo privado agressivo) — id só em memória
    cached = cached ?? mintUUID()
    return cached
  }
}

/** fetch wrapper: injeta x-tenant-id + x-session-token em toda chamada. */
export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const tid = getTenantId()
  if (tid) headers.set(TENANT_HEADER, tid)
  const token = getSessionToken()
  if (token) headers.set(SESSION_HEADER, token)
  return fetch(input, { ...init, headers })
}

/* ------------------------------------------------------------------ */
/* Sessão SaaS (JWT) — persistida no localStorage; o cookie httpOnly     */
/* continua como canal primário quando o navegador o aceita.             */
/* ------------------------------------------------------------------ */

/** Token da sessão atual ou null. */
export function getSessionToken(): string | null {
  if (sessionCache) return sessionCache
  if (typeof window === 'undefined') return null
  try {
    sessionCache = window.localStorage.getItem(SESSION_LS_KEY)
  } catch {
    // storage bloqueado — cookie carrega a sessão
  }
  return sessionCache
}

/** Persista o token retornado por login/registro. */
export function saveSessionToken(token: string): void {
  sessionCache = token
  try {
    window.localStorage.setItem(SESSION_LS_KEY, token)
  } catch {
    // storage bloqueado
  }
}

/** Logout no client (o cookie é apagado pelo server). */
export function clearSessionToken(): void {
  sessionCache = null
  try {
    window.localStorage.removeItem(SESSION_LS_KEY)
  } catch {
    // storage bloqueado
  }
}
