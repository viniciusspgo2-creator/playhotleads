// src/app/api/search/stream/route.ts
// SSE por busca. Serverless-safe: o estado vive no BANCO (Search, Lead,
// SearchEvent). Ao conectar envia um snapshot reconstruído do banco e depois
// faz polling por eventos novos (id crescente). Como a função tem teto de
// tempo, o stream se encerra sozinho antes dele — o EventSource do browser
// reconecta automaticamente e recebe um snapshot novo (sem perda de dados).

import { authErrorResponse, requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildSnapshot } from '@/core/search-snapshot'
import type { SearchEvent } from '@/core/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const POLL_MS = 1_000
const HEARTBEAT_MS = 15_000
/** encerra antes do teto da função; o client reconecta */
const MAX_STREAM_MS = 280_000
/** busca "running" sem nenhum evento por tanto tempo = execução morreu */
const STALE_MS = 120_000

function sseChunk(event: SearchEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    const searchId = new URL(request.url).searchParams.get('id') ?? ''

    const built = await buildSnapshot(searchId, user.tenantId)
    if (!built) return new Response('not found', { status: 404 })

    const encoder = new TextEncoder()
    const startedAt = Date.now()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false
        let cursor = built.lastEventId
        let lastActivity = Date.now()
        let lastBeat = Date.now()
        const seenLeads = built.leadIds

        const write = (chunk: string) => {
          if (closed) return
          try {
            controller.enqueue(encoder.encode(chunk))
          } catch {
            closed = true
          }
        }
        const close = () => {
          if (closed) return
          closed = true
          try {
            controller.close()
          } catch {
            // já fechado
          }
        }
        request.signal.addEventListener('abort', close)

        write(sseChunk({ type: 'snapshot', data: built.snapshot }))

        if (built.finished) {
          write(sseChunk({ type: 'done', stats: built.snapshot.stats }))
          close()
          return
        }

        while (!closed && Date.now() - startedAt < MAX_STREAM_MS) {
          await new Promise((r) => setTimeout(r, POLL_MS))
          if (closed) break

          const rows = await db.searchEvent
            .findMany({
              where: { searchId, id: { gt: cursor } },
              orderBy: { id: 'asc' },
              take: 200,
            })
            .catch(() => [])

          let terminal = false
          for (const row of rows) {
            cursor = row.id
            lastActivity = Date.now()
            let event: SearchEvent
            try {
              event = JSON.parse(row.payload) as SearchEvent
            } catch {
              continue
            }
            // lead que já veio no snapshot vira 'update' (não conta 2x no client)
            if (event.type === 'lead') {
              if (seenLeads.has(event.lead.id)) {
                event = { type: 'update', lead: event.lead }
              } else {
                seenLeads.add(event.lead.id)
              }
            }
            write(sseChunk(event))
            if (event.type === 'done' || event.type === 'cancelled' || event.type === 'error') {
              terminal = true
            }
          }
          if (terminal) break

          if (Date.now() - lastBeat >= HEARTBEAT_MS) {
            write(': ping\n\n')
            lastBeat = Date.now()
          }

          // execução morta (timeout/queda da função) → não deixa "running" eterno
          if (rows.length === 0 && Date.now() - lastActivity > STALE_MS) {
            const row = await db.search
              .findUnique({ where: { id: searchId }, select: { status: true } })
              .catch(() => null)
            if (row && row.status !== 'running') {
              // terminou entre polls: o próximo ciclo traz o evento final; se não
              // houver, reconstrói do banco
              const fin = await buildSnapshot(searchId, user.tenantId)
              if (fin) {
                write(sseChunk({ type: 'snapshot', data: fin.snapshot }))
                write(sseChunk({ type: 'done', stats: fin.snapshot.stats }))
              }
              break
            }
            if (row?.status === 'running') {
              const message = 'a busca foi interrompida (limite de tempo) — tente novamente'
              await db.search
                .updateMany({
                  where: { id: searchId, status: 'running' },
                  data: { status: 'failed', error: message, finishedAt: new Date() },
                })
                .catch(() => undefined)
              write(sseChunk({ type: 'error', message }))
              break
            }
          }
        }
        // limite do stream: o EventSource reconecta e recebe novo snapshot
        close()
      },
    })


    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      },
    })
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return new Response(auth.body.error, { status: auth.status })
    return new Response('erro inesperado', { status: 500 })
  }
}
