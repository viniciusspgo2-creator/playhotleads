// src/core/providers/photon.ts
// Photon (photon.komoot.io) — busca de POIs sobre o OpenStreetMap, global,
// sem key, extremamente rápida e tolerante. Complementa Overpass/Nominatim:
// devolve nome + endereço + coordenadas de TODOS os POIs que casam com o
// termo na região. Sem telefone/site (Photon não expõe contact tags), mas
// com cobertura alta — leads reais de rua, prontos pra prospecção local.

import { ProviderError, type LeadProvider, type RawLead, type SearchParams } from '../types'
import type { ProviderContext } from '../types'
import { fetchText } from './http'
import { geocode, sharedExpansion } from '../expansion'
import { sleep } from '../normalize'

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    osm_id?: number
    osm_type?: string
    osm_key?: string
    osm_value?: string
    name?: string
    housenumber?: string
    street?: string
    district?: string
    city?: string
    postcode?: string
    state?: string
    country?: string
  }
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

function buildAddress(p: NonNullable<PhotonFeature['properties']>): string | undefined {
  const parts = [
    [p.street, p.housenumber].filter(Boolean).join(', '),
    p.district,
    p.city,
  ].filter((v): v is string => Boolean(v && v.length > 0))
  return parts.length > 0 ? parts.join(', ') : undefined
}

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const geo = await geocode(params.location, params.country, ctx.signal)
  if (!geo) {
    throw new ProviderError('photon', `não encontrei "${params.location}" no mapa`)
  }

  const expansion = await sharedExpansion(params.niche, params.location, params.country, ctx.signal)
  const terms = expansion.synonyms.slice(0, 4)

  const seen = new Set<string>()
  let yielded = 0
  let lastError: unknown = null

  for (const term of terms) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()

    const url =
      'https://photon.komoot.io/api/?' +
      new URLSearchParams({
        q: `${term} ${params.location}`,
        lat: geo.lat.toFixed(5),
        lon: geo.lon.toFixed(5),
        limit: '30',
      })

    try {
      const { body } = await fetchText('photon', url, {
        signal: ctx.signal,
        timeoutMs: 10_000,
        headers: { 'user-agent': 'PlayHotLeads/1.0 (POI discovery)' },
      })
      const parsed = JSON.parse(body) as PhotonResponse
      const features = parsed.features ?? []

      for (const f of features) {
        if (ctx.signal.aborted) return
        const p = f.properties
        const name = (p?.name ?? '').trim()
        if (!p || name.length < 2) continue

        const key = `${p.osm_type ?? 'n'}${p.osm_id ?? name}`
        if (seen.has(key)) continue
        seen.add(key)

        const [lon, lat] = f.geometry?.coordinates ?? [NaN, NaN]
        yielded += 1
        yield {
          source: 'photon',
          name,
          address: buildAddress(p),
          mapsUrl: Number.isFinite(lat) && Number.isFinite(lon)
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${params.location}`)}`,
        }
        await sleep(20, ctx.signal).catch(() => undefined)
      }
    } catch (err) {
      lastError = err
      if (ctx.signal.aborted) return
      continue
    }
  }

  if (yielded === 0) {
    const message = lastError instanceof Error ? lastError.message : String(lastError ?? '')
    throw new ProviderError('photon', `nenhum POI para "${params.niche}" em ${params.location}${message ? ` (${message})` : ''}`)
  }
}

export const photonProvider: LeadProvider = {
  id: 'photon',
  label: 'Photon (OSM POI)',
  mode: 'api',
  runModes: ['live'],
  requiresProxy: false,
  requiresApiKey: false,
  countries: 'global',
  costPerRequest: 0,
  note: 'busca global de POIs do OSM — nome + endereço, rápida e sem key',
  search: searchLive,
}
