// src/core/providers/yelp.ts
// Yelp — scraping free. Live tenta o HTML da busca (JSON-LD embutido);
// bloqueios são isolados. Demo: fatia do pool (índices 8–13, com
// sobreposição de 2 com Maps → merges "2 fontes").

import { ProviderError, type LeadProvider, type RawLead, type SearchParams, type ProviderContext } from '../types'
import { buildDemoPool } from './demo-data'
import { sleep } from '../normalize'
import { fetchText } from './http'

interface YelpJsonLd {
  '@type'?: string
  name?: string
  telephone?: string
  url?: string
  address?: { streetAddress?: string }
  aggregateRating?: { ratingValue?: string | number }
}

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const q = encodeURIComponent(params.niche)
  const loc = encodeURIComponent(params.location)
  const { body } = await fetchText(
    'yelp',
    `https://www.yelp.com/search?find_desc=${q}&find_loc=${loc}`,
    { signal: ctx.signal, timeoutMs: 14_000, maxBytes: 600_000 },
  )

  const jsonLdRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  let match: RegExpExecArray | null
  let yielded = 0
  while ((match = jsonLdRe.exec(body)) !== null) {
    if (ctx.signal.aborted) return
    try {
      const data = JSON.parse(match[1] ?? 'null') as YelpJsonLd | YelpJsonLd[] | null
      const items = Array.isArray(data) ? data : data ? [data] : []
      for (const item of items) {
        if (item['@type'] !== 'LocalBusiness' || !item.name) continue
        yield {
          source: 'yelp',
          name: item.name,
          phone: item.telephone,
          website: item.url,
          address: item.address?.streetAddress,
          rating: item.aggregateRating?.ratingValue
            ? Number(item.aggregateRating.ratingValue)
            : undefined,
        }
        yielded += 1
        if (yielded >= Math.min(params.limit, 12)) return
      }
    } catch {
      // bloco JSON-LD inválido — segue pro próximo
    }
  }
  if (yielded === 0) {
    throw new ProviderError('yelp', 'JSON-LD não encontrado — layout mudou ou acesso bloqueado', true)
  }
}

async function* searchDemo(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const pool = buildDemoPool(params, params.seed ?? "phl-default", 20)
  for (let i = 8; i < 14; i++) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()
    await sleep(450 + Math.floor(Math.random() * 500), ctx.signal)
    const biz = pool[i]
    if (!biz) return
    yield {
      source: 'yelp',
      name: biz.name,
      phone: biz.phone,
      mobile: biz.mobile,
      website: biz.website ?? undefined,
      mapsUrl: biz.mapsUrl,
      address: biz.address,
      socials: biz.socials,
      rating: biz.rating ?? undefined,
    }
  }
}

export const yelpProvider: LeadProvider = {
  id: 'yelp',
  label: 'Yelp (scraping)',
  mode: 'scrape',
  runModes: ['demo', 'live'],
  requiresProxy: false,
  requiresApiKey: false,
  countries: 'global',
  note: 'grátis, cadência humana embutida',
  search(params, ctx) {
    return ctx.runMode === 'live' ? searchLive(params, ctx) : searchDemo(params, ctx)
  },
}
