// src/core/providers/nominatim.ts
// Nominatim (OpenStreetMap) — busca textual de POIs por termo × localidade.
// Gratuita, sem key. Complementa o Overpass: pega POIs que casam o termo
// como categoria/nome mesmo fora do bbox apertado, e traz extratags
// (phone/website/email) quando o mapeador preencheu.

import { ProviderError, type LeadProvider, type RawLead, type SearchParams } from '../types'
import type { ProviderContext } from '../types'
import { fetchText } from './http'
import { sharedExpansion } from '../expansion'
import { sleep } from '../normalize'

const UA = 'PlayHotLeads/1.0 (lead generation tool; +https://playhotleads.com)'

interface NominatimItem {
  place_id?: number
  osm_type?: string
  osm_id?: number
  lat?: string
  lon?: string
  name?: string
  display_name?: string
  category?: string
  type?: string
  address?: Record<string, string>
  extratags?: Record<string, string>
}

function buildAddress(item: NominatimItem): string | undefined {
  const a = item.address
  if (a) {
    const parts = [
      [a.road, a.house_number].filter(Boolean).join(', '),
      a.suburb,
      a.city ?? a.town ?? a.village ?? a.municipality,
    ].filter((p): p is string => Boolean(p && p.length > 0))
    if (parts.length > 0) return parts.join(', ')
  }
  if (item.display_name) {
    // display_name completo é longo — mantém os 3 primeiros segmentos
    return item.display_name.split(',').slice(0, 3).join(',').trim()
  }
  return undefined
}

function itemToLead(item: NominatimItem, location: string): RawLead | null {
  const name = (item.name ?? '').trim()
  if (name.length < 2) return null

  const ext = item.extratags ?? {}
  const phone = ext.phone ?? ext['contact:phone'] ?? ext['contact:mobile']
  const website = ext.website ?? ext['contact:website'] ?? ext.url
  const email = ext.email ?? ext['contact:email']

  const socials: RawLead['socials'] = {}
  const ig = ext['contact:instagram']
  if (ig) socials.instagram = /^https?:\/\//i.test(ig) ? ig : `https://instagram.com/${ig.replace(/^@/, '')}`
  const fb = ext['contact:facebook']
  if (fb) socials.facebook = /^https?:\/\//i.test(fb) ? fb : `https://facebook.com/${fb.replace(/^\/+/, '')}`

  const lat = item.lat ? Number(item.lat) : NaN
  const lon = item.lon ? Number(item.lon) : NaN

  return {
    source: 'nominatim',
    name,
    phone,
    email,
    website,
    mapsUrl: Number.isFinite(lat) && Number.isFinite(lon)
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${location}`)}`,
    address: buildAddress(item),
    socials: Object.keys(socials).length > 0 ? socials : undefined,
  }
}

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const expansion = await sharedExpansion(params.niche, params.location, params.country, ctx.signal)
  const terms = expansion.synonyms.slice(0, 5)

  // cidades vizinhas: termo principal × até 2 vizinhas (+2 requests no máximo)
  const statePart = params.location.split(',').slice(1).join(',').trim()
  const neighborQueries = expansion.cities.slice(0, 2).map((city) => ({
    term: expansion.synonyms[0] ?? params.niche,
    label: statePart ? `${city}, ${statePart}` : city,
  }))

  const seen = new Set<string>()
  let yielded = 0

  const runOne = async (term: string, location: string): Promise<NominatimItem[]> => {
    await ctx.rateLimiter.take()
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: `${term} ${location}`,
        format: 'jsonv2',
        limit: '30',
        addressdetails: '1',
        extratags: '1',
        countrycodes: params.country.toLowerCase(),
      })
    const { body } = await fetchText('nominatim', url, {
      signal: ctx.signal,
      timeoutMs: 12_000,
      headers: { 'user-agent': UA, 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' },
    })
    const parsed: unknown = JSON.parse(body)
    if (!Array.isArray(parsed)) throw new Error('resposta inesperada do Nominatim')
    return parsed as NominatimItem[]
  }

  type QuerySpec = { term: string; location: string; last: boolean }
  const specs: QuerySpec[] = [
    ...terms.map((term, i) => ({ term, location: params.location, last: i === terms.length - 1 && neighborQueries.length === 0 })),
    ...neighborQueries.map((n, i) => ({ term: n.term, location: n.label, last: i === neighborQueries.length - 1 })),
  ]

  for (const spec of specs) {
    if (ctx.signal.aborted) return

    let items: NominatimItem[]
    try {
      items = await runOne(spec.term, spec.location)
    } catch (err) {
      // termo falhou → tenta o próximo (404/429/timeout não derrubam a fonte)
      if (ctx.signal.aborted) return
      const message = err instanceof Error ? err.message : String(err)
      if (yielded === 0 && spec.last) {
        throw new ProviderError('nominatim', `falhou para todos os termos: ${message}`)
      }
      continue
    }

    for (const item of items) {
      if (ctx.signal.aborted) return
      const key = `${item.osm_type ?? 'n'}/${item.osm_id ?? item.place_id ?? Math.random()}`
      if (seen.has(key)) continue
      seen.add(key)

      const lead = itemToLead(item, spec.location)
      if (!lead) continue
      yielded += 1
      yield lead
    }
  }

  if (yielded === 0) {
    throw new ProviderError('nominatim', `nenhum POI para "${params.niche}" em ${params.location}`)
  }

  await sleep(30, ctx.signal).catch(() => undefined)
}

export const nominatimProvider: LeadProvider = {
  id: 'nominatim',
  label: 'Nominatim (OSM POI)',
  mode: 'api',
  runModes: ['live'],
  requiresProxy: false,
  requiresApiKey: false,
  countries: 'global',
  costPerRequest: 0,
  note: 'busca textual de POIs no OSM com telefone/site quando mapeado',
  search: searchLive,
}
