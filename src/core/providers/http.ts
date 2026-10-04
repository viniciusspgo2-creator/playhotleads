// src/core/providers/http.ts
// Utilitário HTTP compartilhado pelos providers em modo live:
// timeout, User-Agent, cap de tamanho e mapeamento de bloqueio
// (403/429 → ProviderError blocked) pra isolação correta no orquestrador.

import { ProviderError, type ProviderId } from '../types'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export interface HttpResult {
  status: number
  body: string
}

export async function fetchText(
  providerId: ProviderId,
  url: string,
  opts: {
    signal: AbortSignal
    timeoutMs?: number
    headers?: Record<string, string>
    maxBytes?: number
  },
): Promise<HttpResult> {
  const timeout = AbortSignal.timeout(opts.timeoutMs ?? 10_000)
  const signal = AbortSignal.any([opts.signal, timeout])

  let response: Response
  try {
    response = await fetch(url, {
      signal,
      headers: { 'user-agent': UA, ...(opts.headers ?? {}) },
      redirect: 'follow',
    })
  } catch (err) {
    if (opts.signal.aborted) throw err // cancelamento legítimo — propagar
    throw new ProviderError(providerId, `rede indisponível: ${String(err)}`)
  }

  if (response.status === 403 || response.status === 429 || response.status === 302) {
    throw new ProviderError(
      providerId,
      `HTTP ${response.status} — ${response.status === 429 ? 'rate limit' : 'bloqueado pela fonte'}`,
      true,
    )
  }
  if (!response.ok) {
    throw new ProviderError(providerId, `HTTP ${response.status}`)
  }

  // Cap de leitura — nunca baixar páginas gigantes inteiras
  const reader = response.body?.getReader()
  if (!reader) return { status: response.status, body: '' }
  const maxBytes = opts.maxBytes ?? 400_000
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      received += value.byteLength
      if (received > maxBytes) {
        void reader.cancel().catch(() => {})
        break
      }
    }
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return { status: response.status, body }
}
