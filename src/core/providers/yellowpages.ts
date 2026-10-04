// src/core/providers/yellowpages.ts
// Yellow Pages — scraping free. Live tenta HTML com cards h2/a/phone;
// Demo: fatia exclusiva do pool (índices 14–17, sem sobreposição —
// lead que só existe em uma fonte).

import { ProviderError, type LeadProvider, type RawLead, type SearchParams, type ProviderContext } from '../types'
import { buildDemoPool } from './demo-data'
import { sleep } from '../normalize'
import { fetchText } from './http'

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const q = encodeURIComponent(params.niche)
  const loc = encodeURIComponent(params.location)
  const { body } = await fetchText(
    'yellowpages',
    `https://www.yellowpages.com/search?search_terms=${q}&geo_location_terms=${loc}`,
    { signal: ctx.signal, timeoutMs: 14_000, maxBytes: 600_000 },
  )

  // Cards: <div class="result">… <a class="business-name">Nome</a> … phone
  const cardRe = /class="info[^"]*"([\s\S]*?)(?=class="info|$)/g
  const nameRe = /class="business-name[^"]*"[^>]*>([^<]+)</
  const phoneRe = /class="phones phone primary[^"]*"[^>]*>([^<]+)</
  const siteRe = /class="track-visit-website[^"]*"[^>]*href="([^"]+)"/

  let count = 0
  let match: RegExpExecArray | null
  while ((match = cardRe.exec(body)) !== null) {
    if (ctx.signal.aborted) return
    const card = match[1] ?? ''
    const name = nameRe.exec(card)?.[1]?.trim()
    if (!name) continue
    yield {
      source: 'yellowpages',
      name,
      phone: phoneRe.exec(card)?.[1]?.trim(),
      website: siteRe.exec(card)?.[1]?.replace(/&amp;/g, '&'),
      address: params.location,
    }
    count += 1
    if (count >= Math.min(params.limit, 10)) return
  }
  if (count === 0) {
    throw new ProviderError('yellowpages', 'nenhum card encontrado — layout mudou ou bloqueio', true)
  }
}

async function* searchDemo(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const pool = buildDemoPool(params, params.seed ?? "phl-default", 20)
  for (let i = 14; i < 18; i++) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()
    await sleep(550 + Math.floor(Math.random() * 550), ctx.signal)
    const biz = pool[i]
    if (!biz) return
    yield {
      source: 'yellowpages',
      name: biz.name,
      phone: biz.phone,
      mobile: biz.mobile,
      website: biz.website ?? undefined,
      mapsUrl: biz.mapsUrl,
      address: biz.address,
      rating: biz.rating ?? undefined,
    }
  }
}

export const yellowpagesProvider: LeadProvider = {
  id: 'yellowpages',
  label: 'Yellow Pages (scraping)',
  mode: 'scrape',
  runModes: ['demo', 'live'],
  requiresProxy: false,
  requiresApiKey: false,
  countries: 'global',
  note: 'diretórios de negócios, dado público',
  search(params, ctx) {
    return ctx.runMode === 'live' ? searchLive(params, ctx) : searchDemo(params, ctx)
  },
}
