// src/core/providers/maps-scraper.ts
// Scraping do Google Maps — fonte free sujeita a bloqueio (requiresProxy).
// Live: tenta HTML público do Maps; bloqueios 403/429 são mapeados pra
// ProviderError(blocked) e isolados pelo orquestrador (regra nº 8).
// Demo: fatia do pool COM sobreposição intencional com Google Places
// (índices 4–9) — é o que faz a deduplicação multi-fonte aparecer.

import { ProviderError, type LeadProvider, type RawLead, type SearchParams, type ProviderContext } from '../types'
import { buildDemoPool } from './demo-data'
import { sleep } from '../normalize'
import { fetchText } from './http'

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const query = encodeURIComponent(`${params.niche} ${params.location}`)
  const { body } = await fetchText('maps-scraper', `https://www.google.com/maps/search/${query}`, {
    signal: ctx.signal,
    timeoutMs: 14_000,
    maxBytes: 600_000,
  })

  // Parse leve do HTML público: entradas /maps/place/ + telefones no payload
  const seen = new Set<string>()
  const placeRe = /\/maps\/place\/([^"?]+)/g
  let match: RegExpExecArray | null
  while ((match = placeRe.exec(body)) !== null) {
    if (ctx.signal.aborted) return
    const slug = match[1] ?? ''
    const name = decodeURIComponent(slug.split('/@')[0] ?? '').replace(/\+/g, ' ').trim()
    if (!name || name.length < 3 || seen.has(name)) continue
    seen.add(name)
    yield {
      source: 'maps-scraper',
      name,
      mapsUrl: `https://www.google.com/maps/place/${slug}`,
      address: params.location,
    }
    if (seen.size >= Math.min(params.limit, 12)) return
  }
  if (seen.size === 0) {
    throw new ProviderError('maps-scraper', 'HTML sem resultados — fonte pode ter mudado o layout')
  }
}

async function* searchDemo(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const pool = buildDemoPool(params, params.seed ?? "phl-default", 20)
  for (let i = 4; i < 10; i++) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()
    await sleep(500 + Math.floor(Math.random() * 600), ctx.signal)
    const biz = pool[i]
    if (!biz) return
    // Maps scrape costuma trazer dados mais "sujos": sem site/email às vezes
    yield {
      source: 'maps-scraper',
      name: biz.name,
      phone: biz.phone,
      mobile: biz.mobile,
      website: rng(ctx) < 0.7 ? (biz.website ?? undefined) : undefined,
      mapsUrl: biz.mapsUrl,
      address: biz.address,
      rating: biz.rating ?? undefined,
    }
  }
}

function rng(ctx: ProviderContext): number {
  return Math.random() // jitter de qualidade de dado; determinismo vem do pool
}

export const mapsScraperProvider: LeadProvider = {
  id: 'maps-scraper',
  label: 'Google Maps (scraping)',
  mode: 'scrape',
  runModes: ['demo', 'live'],
  requiresProxy: true,
  requiresApiKey: false,
  countries: 'global',
  note: 'grátis, sujeito a bloqueio — use com proxy',
  search(params, ctx) {
    return ctx.runMode === 'live' ? searchLive(params, ctx) : searchDemo(params, ctx)
  },
}
