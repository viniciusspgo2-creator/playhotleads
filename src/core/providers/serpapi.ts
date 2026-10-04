// src/core/providers/serpapi.ts
// SerpAPI (engine=google_maps) — busca orgânica/mapas via API paga (BYOK).
// Demo: 2 leads da cauda do pool (índices 18–19) + 1 de sobreposição (6).

import { ProviderError, type LeadProvider, type RawLead, type SearchParams, type ProviderContext } from '../types'
import { buildDemoPool } from './demo-data'
import { sleep } from '../normalize'
import { fetchText } from './http'

interface SerpResponse {
  local_results?: {
    title?: string
    address?: string
    phone?: string
    website?: string
    rating?: number
    gps_coordinates?: { latitude?: number; longitude?: number }
  }[]
}

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const key = ctx.apiKeys.serpapi
  if (!key) throw new ProviderError('serpapi', 'chave SerpAPI ausente')

  await ctx.rateLimiter.take()
  const q = encodeURIComponent(`${params.niche} in ${params.location}`)
  const { body } = await fetchText(
    'serpapi',
    `https://serpapi.com/search.json?engine=google_maps&q=${q}&hl=${ctx.locale}&api_key=${encodeURIComponent(key)}`,
    { signal: ctx.signal, timeoutMs: 20_000, maxBytes: 900_000 },
  )
  const parsed = JSON.parse(body) as SerpResponse
  const results = parsed.local_results ?? []
  if (results.length === 0) {
    throw new ProviderError('serpapi', 'sem resultados no Google Maps (SerpAPI)')
  }
  for (const item of results) {
    if (ctx.signal.aborted) return
    if (!item.title) continue
    const [lat, lng] = [item.gps_coordinates?.latitude, item.gps_coordinates?.longitude]
    yield {
      source: 'serpapi',
      name: item.title,
      phone: item.phone,
      website: item.website,
      address: item.address,
      rating: item.rating,
      mapsUrl: lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : undefined,
    }
  }
}

async function* searchDemo(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const pool = buildDemoPool(params, params.seed ?? "phl-default", 20)
  for (const i of [18, 19, 6]) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()
    await sleep(400 + Math.floor(Math.random() * 400), ctx.signal)
    const biz = pool[i]
    if (!biz) return
    yield {
      source: 'serpapi',
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

export const serpapiProvider: LeadProvider = {
  id: 'serpapi',
  label: 'SerpAPI',
  mode: 'api',
  runModes: ['demo', 'live'],
  requiresProxy: false,
  requiresApiKey: true,
  countries: 'global',
  costPerRequest: 0.05,
  note: 'busca orgânica complementar (Google Maps via SerpAPI)',
  search(params, ctx) {
    return ctx.runMode === 'live' ? searchLive(params, ctx) : searchDemo(params, ctx)
  },
}
