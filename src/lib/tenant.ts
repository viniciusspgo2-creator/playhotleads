// src/lib/tenant.ts
// Multi-tenant em app-layer (SQLite não tem RLS — ver worklog): TODA query
// passa por helpers que exigem tenantId. O cookie phl_tenant é emitido pelo
// middleware e cada rota resolve/garante o tenant antes de tocar no banco.

import { cookies, headers } from 'next/headers'
import { db } from '@/lib/db'
import { TENANT_COOKIE, TENANT_HEADER, isValidTenantId } from './tenant-constants'

const TENANT_NAMES = ['Meu workspace', 'Workspace', 'Play Hot Leads']

/** Garante que o tenant existe; cria com defaults na primeira visita. */
export async function ensureTenant(tenantId: string) {
  const existing = await db.tenant.findUnique({ where: { id: tenantId } })
  if (existing) return existing

  const created = await db.tenant.create({
    data: {
      id: tenantId,
      name: TENANT_NAMES[Math.floor(Math.random() * TENANT_NAMES.length)] ?? 'Workspace',
      settings: {
        create: {
          enabledProviders: JSON.stringify({
            'google-places': true,
            'maps-scraper': false,
            yelp: true,
            yellowpages: true,
            'website-crawler': true,
            serpapi: false,
          }),
          providerModes: JSON.stringify({
            'google-places': 'demo',
            'maps-scraper': 'demo',
            yelp: 'demo',
            yellowpages: 'demo',
            'website-crawler': 'demo',
            serpapi: 'demo',
          }),
        },
      },
    },
    include: { settings: true },
  })
  return created
}

/** Resolve o tenant do request atual.
 *
 * Cadeia de fallback (o preview do builder roda em iframe cross-site que
 * bloqueia cookies — o client manda x-tenant-id, e o EventSource, que não
 * aceita headers custom, manda ?tid=). Header tem prioridade sobre cookie:
 * é a identidade durável do localStorage, a MESMA fonte do ?tid= do SSE —
 * assim fetch e stream nunca caem em tenants diferentes.
 *   1. header x-tenant-id (apiFetch injeta)
 *   2. cookie phl_tenant (httpOnly)
 *   3. query ?tid= (somente quando `request` é passado — rota de SSE)
 */
export async function resolveTenant(request?: Request) {
  const hdrs = await headers()
  let tenantId = hdrs.get(TENANT_HEADER)

  if (!isValidTenantId(tenantId)) {
    const store = await cookies()
    tenantId = store.get(TENANT_COOKIE)?.value ?? null
  }

  if (!isValidTenantId(tenantId) && request) {
    tenantId = new URL(request.url).searchParams.get('tid')
  }

  if (!isValidTenantId(tenantId)) {
    throw new TenantError('tenant ausente — sem cookie, header x-tenant-id nem ?tid=')
  }
  return ensureTenant(tenantId)
}

export class TenantError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TenantError'
  }
}
