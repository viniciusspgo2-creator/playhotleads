// src/core/queue.ts
// Fila in-process (sem Redis no sandbox): jobs assíncronos com concorrência
// limitada, retry com backoff exponencial. Scraping pesado NUNCA roda dentro
// do request HTTP — handlers apenas enfileiram (regra arquitetural).
//
// Trade-off declarado: em produção, trocar por BullMQ/Redis mantendo a
// mesma assinatura de enqueue — nenhum provider/orchestrador muda.

export interface JobOptions {
  /** identificador pra observabilidade */
  key: string
  attempts?: number
  /** backoff base em ms (1.5^n) */
  backoffMs?: number
}

export interface JobHandle {
  id: number
  key: string
}

interface QueuedJob {
  id: number
  key: string
  attempts: number
  maxAttempts: number
  backoffMs: number
  run: () => Promise<void>
}

const globalForQueue = globalThis as unknown as {
  __phlQueue?: {
    pending: QueuedJob[]
    running: number
    nextId: number
    concurrency: number
    failed: { key: string; error: string; at: string }[]
  }
}

function state() {
  if (!globalForQueue.__phlQueue) {
    globalForQueue.__phlQueue = {
      pending: [],
      running: 0,
      nextId: 1,
      concurrency: 4,
      failed: [],
    }
  }
  return globalForQueue.__phlQueue
}

function pump(): void {
  const s = state()
  while (s.running < s.concurrency && s.pending.length > 0) {
    const job = s.pending.shift()
    if (!job) break
    s.running += 1
    void (async () => {
      try {
        await job.run()
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (job.attempts < job.maxAttempts) {
          job.attempts += 1
          const delay = Math.round(job.backoffMs * Math.pow(1.5, job.attempts - 1))
          setTimeout(() => {
            s.pending.push(job)
            pump()
          }, delay)
        } else {
          s.failed.unshift({ key: job.key, error: message, at: new Date().toISOString() })
          s.failed = s.failed.slice(0, 50)
        }
      } finally {
        s.running -= 1
        pump()
      }
    })()
  }
}

/** Enfileira trabalho pesado; erros são tratados pela fila (retry/backoff). */
export function enqueueJob(run: () => Promise<void>, opts: JobOptions): JobHandle {
  const s = state()
  const job: QueuedJob = {
    id: s.nextId++,
    key: opts.key,
    attempts: 1,
    maxAttempts: opts.attempts ?? 2,
    backoffMs: opts.backoffMs ?? 500,
    run,
  }
  s.pending.push(job)
  pump()
  return { id: job.id, key: job.key }
}

/**
 * Resolve quando a fila esvazia (nada pendente nem rodando) ou ao estourar
 * `maxWaitMs`. Em serverless, o request/after() precisa aguardar os jobs
 * in-process — a função é congelada assim que a promise principal termina.
 */
export async function drainQueue(maxWaitMs = 25_000): Promise<void> {
  const s = state()
  const deadline = Date.now() + maxWaitMs
  while ((s.pending.length > 0 || s.running > 0) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200))
  }
}

export function queueStats(): { pending: number; running: number; failed: number } {
  const s = state()
  return { pending: s.pending.length, running: s.running, failed: s.failed.length }
}
