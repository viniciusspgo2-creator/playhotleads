// src/lib/bus.ts
// Eventos de busca PERSISTIDOS no banco (tabela SearchEvent).
//
// Por quê: na Vercel cada request pode cair numa instância diferente, então
// um pub/sub em memória não liga quem executa a busca (after()) a quem serve
// o SSE. Agora quem executa grava e o stream faz polling por id crescente.
//
// publishSearch continua síncrona (fire-and-forget) para não mudar os call
// sites; os INSERTs são encadeados por busca para preservar a ordem, e
// flushSearchEvents() permite aguardar a gravação antes de encerrar a função.

import { db } from '@/lib/db'
import type { CampaignEvent, SearchEvent } from '@/core/types'

const chains = new Map<string, Promise<void>>()

export function publishSearch(searchId: string, event: SearchEvent): void {
  const prev = chains.get(searchId) ?? Promise.resolve()
  const next = prev
    .then(() =>
      db.searchEvent
        .create({ data: { searchId, type: event.type, payload: JSON.stringify(event) } })
        .then(() => undefined),
    )
    .catch(() => undefined) // evento perdido nunca derruba a busca
  chains.set(searchId, next)
}

/** Aguarda todos os eventos pendentes da busca serem gravados. */
export async function flushSearchEvents(searchId: string): Promise<void> {
  const tail = chains.get(searchId)
  if (tail) await tail
  if (chains.get(searchId) === tail) chains.delete(searchId)
}

/** Remove eventos antigos (retenção de 2 dias) — chamado ao iniciar buscas. */
export async function pruneSearchEvents(): Promise<void> {
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  await db.searchEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => undefined)
}

/**
 * Campanhas: o client faz polling em GET /api/campaigns (estado vive no
 * banco), então não há barramento. Mantida por compatibilidade de assinatura.
 */
export function publishCampaign(_campaignId: string, _event: CampaignEvent): void {
  // no-op intencional
}
