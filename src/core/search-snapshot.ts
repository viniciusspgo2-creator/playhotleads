// src/core/search-snapshot.ts
// Snapshot de uma busca reconstruído 100% a partir do BANCO (leads + eventos),
// válido em qualquer instância serverless. Usado pelo SSE e pelo GET /api/search/[id].

import { db } from '@/lib/db'
import { toLeadDTO } from './dto'
import type { ProviderId, ProviderRuntimeStatus, SearchEvent, SearchSnapshotDTO } from './types'

export interface BuiltSnapshot {
  snapshot: SearchSnapshotDTO
  /** maior id de evento já refletido no snapshot (cursor do polling) */
  lastEventId: number
  /** ids de leads presentes no snapshot (evita contar 'lead' duas vezes) */
  leadIds: Set<string>
  finished: boolean
}

export async function buildSnapshot(searchId: string, tenantId: string): Promise<BuiltSnapshot | null> {
  // cursor ANTES de ler leads: eventos posteriores chegam pelo tail
  const last = await db.searchEvent.findFirst({
    where: { searchId },
    orderBy: { id: 'desc' },
    select: { id: true },
  })
  const lastEventId = last?.id ?? 0

  const search = await db.search.findFirst({
    where: { id: searchId, tenantId },
    include: { leads: { orderBy: { createdAt: 'desc' }, take: 60 } },
  })
  if (!search) return null

  const [uniqueCount, dedupCount, providerEvents] = await Promise.all([
    db.lead.count({ where: { searchId } }),
    db.searchEvent.count({ where: { searchId, type: 'dedup', id: { lte: lastEventId } } }),
    db.searchEvent.findMany({
      where: { searchId, type: 'provider', id: { lte: lastEventId } },
      orderBy: { id: 'asc' },
      select: { payload: true },
    }),
  ])

  // dobra os eventos 'provider' no estado atual de cada fonte
  const providers = new Map<ProviderId, ProviderRuntimeStatus>()
  for (const row of providerEvents) {
    try {
      const e = JSON.parse(row.payload) as Extract<SearchEvent, { type: 'provider' }>
      const prev = providers.get(e.id)
      providers.set(e.id, {
        id: e.id,
        status: e.status,
        found: e.found ?? prev?.found ?? 0,
        note: e.note ?? (e.status === prev?.status ? prev?.note : undefined),
      })
    } catch {
      // payload corrompido — ignora
    }
  }

  const finished = search.status !== 'running'
  const stats = finished
    ? { unique: search.totalFound, duplicates: search.duplicates, enriched: search.enriched }
    : { unique: uniqueCount, duplicates: dedupCount, enriched: search.enriched }

  return {
    snapshot: {
      id: search.id,
      niche: search.niche,
      location: search.location,
      country: search.country,
      status: search.status as SearchSnapshotDTO['status'],
      stats,
      providers: [...providers.values()],
      leads: search.leads.map(toLeadDTO),
    },
    lastEventId,
    leadIds: new Set(search.leads.map((l) => l.id)),
    finished,
  }
}
