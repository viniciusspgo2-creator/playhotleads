// src/lib/tenant-constants.ts
// Constantes de tenant compartilhadas entre middleware (Edge Runtime) e
// código server (Node). Zero imports — precisa ser Edge-safe.

export const TENANT_COOKIE = 'phl_tenant'
/** Cookie espelho legível por JS (o principal é httpOnly) — fallback pro client. */
export const TENANT_COOKIE_VISIBLE = 'phl_tenant_vis'
/** Header que o client envia em TODA chamada de API (fallback p/ ambientes
 *  que bloqueiam cookies de terceiros — ex.: preview em iframe cross-site). */
export const TENANT_HEADER = 'x-tenant-id'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Só UUID v4 válido vira tenant id (evita linhas lixo por input forjado). */
export function isValidTenantId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}
