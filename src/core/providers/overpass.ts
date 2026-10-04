// src/core/providers/overpass.ts
// Fonte OpenStreetMap via Overpass API — 100% gratuita, sem key. O Overpass
// é um banco espacial: query por ÁREA (relation do Nominatim, pré-indexada)
// retorna TODOS os negócios mapeados da cidade inteira que casam com os
// sinônimos (nome) ou com as tags de categoria (shop/craft) — técnica dos
// projetos open-source de referência (drolbr/Overpass-API, overpass-turbo).
//
// Multiplicação de cobertura: 1 query por cidade (principal + até 2 vizinhas
// da região metropolitana vindas do LLM). Só 3 statements por query — barato
// pra infra pública (regra de bom cidadão).

import { ProviderError, type LeadProvider, type RawLead, type SearchParams } from '../types'
import type { ProviderContext } from '../types'
import { fetchText } from './http'
import { geocode, sharedExpansion, type GeoInfo } from '../expansion'
import { sleep } from '../normalize'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
]

/** Cap de elementos por busca — bom cidadão com a infra pública. */
const MAX_ELEMENTS = 160

/** cidades vizinhas consultadas além da principal */
const MAX_NEIGHBOR_CITIES = 2

interface OverpassElement {
  type?: string
  id?: number
  lat?: number
  lon?: number
  center?: { lat?: number; lon?: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
}

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** id de área Overpass: relation = 3600000000+id, way = 2400000000+id */
function areaIdFor(geo: GeoInfo): number | null {
  if (geo.osmType === 'relation' && geo.osmId) return 3_600_000_000 + geo.osmId
  if (geo.osmType === 'way' && geo.osmId) return 2_400_000_000 + geo.osmId
  return null
}

function buildQuery(geo: GeoInfo, nameRe: string, tagRe: string): string {
  const nameMatch = (scope: string): string =>
    `node["name"~"${nameRe}",i][~"^(shop|craft|office|amenity|healthcare|tourism)$"~"."](${scope});` +
    `way["name"~"${nameRe}",i][~"^(shop|craft|office|amenity|healthcare|tourism)$"~"."](${scope});`

  const parts: string[] = []
  const areaId = areaIdFor(geo)
  let prologue = '[out:json][timeout:25];'
  let scope: string

  if (areaId) {
    prologue += `area(${areaId})->.a;`
    scope = 'area.a'
  } else {
    const [s, w, n, e] = geo.bbox.map((v) => v.toFixed(6))
    scope = `(${s},${w},${n},${e})`
  }

  parts.push(nameMatch(scope))
  if (tagRe) {
    parts.push(`node["shop"~"${tagRe}",i](${scope});way["shop"~"${tagRe}",i](${scope});`)
  }

  return `${prologue}(${parts.join('')});out center tags ${MAX_ELEMENTS};`
}

function normalizeSocial(value: string, base: 'instagram' | 'facebook'): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (base === 'instagram') {
    const handle = trimmed.replace(/^@/, '').replace(/^\/+/, '')
    return `https://instagram.com/${handle}`
  }
  return `https://facebook.com/${trimmed.replace(/^\/+/, '')}`
}

function elementToLead(el: OverpassElement, fallbackQuery: string): RawLead | null {
  const tags = el.tags
  if (!tags) return null

  const name = (tags.name ?? '').trim()
  if (name.length < 2) return null

  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon

  const addressParts: string[] = []
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ')
  if (street) addressParts.push(street)
  if (tags['addr:suburb']) addressParts.push(tags['addr:suburb'])
  if (tags['addr:city']) addressParts.push(tags['addr:city'])

  const socials: RawLead['socials'] = {}
  if (tags['contact:instagram']) socials.instagram = normalizeSocial(tags['contact:instagram'], 'instagram')
  if (tags['contact:facebook']) socials.facebook = normalizeSocial(tags['contact:facebook'], 'facebook')

  const mapsUrl = Number.isFinite(lat) && Number.isFinite(lon)
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${fallbackQuery}`)}`

  return {
    source: 'overpass',
    name,
    phone: tags.phone ?? tags['contact:phone'] ?? tags['contact:mobile'],
    email: tags.email ?? tags['contact:email'],
    website: tags.website ?? tags['contact:website'] ?? tags.url,
    mapsUrl,
    address: addressParts.length > 0 ? addressParts.join(', ') : undefined,
    socials: Object.keys(socials).length > 0 ? socials : undefined,
  }
}

async function runOverpass(query: string, ctx: ProviderContext): Promise<string> {
  let lastError: unknown = null
  for (const endpoint of ENDPOINTS) {
    if (ctx.signal.aborted) break
    try {
      const res = await fetchText('overpass', `${endpoint}?data=${encodeURIComponent(query)}`, {
        signal: ctx.signal,
        timeoutMs: 35_000,
        maxBytes: 4_000_000,
        headers: { 'user-agent': 'PlayHotLeads/1.0 (OpenStreetMap lead discovery)' },
      })
      return res.body
    } catch (err) {
      lastError = err
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError)
  throw new ProviderError('overpass', `todos os endpoints falharam: ${message}`)
}

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  // 1) geocoding da localização principal
  const mainGeo = await geocode(params.location, params.country, ctx.signal)
  if (!mainGeo) {
    throw new ProviderError('overpass', `não encontrei "${params.location}" no mapa`)
  }

  // 2) expansão (LLM compartilhado: sinônimos + tags OSM + cidades vizinhas)
  const expansion = await sharedExpansion(params.niche, params.location, params.country, ctx.signal)
  const nameRe = expansion.synonyms.slice(0, 8).map(escapeRegex).join('|')
  const tagRe = expansion.osmTags.slice(0, 4).join('|')

  // 3) geocoding das vizinhas (1 query Overpass por cidade)
  const statePart = params.location.split(',').slice(1).join(',').trim()
  const geos: GeoInfo[] = [mainGeo]
  for (const city of expansion.cities.slice(0, MAX_NEIGHBOR_CITIES)) {
    if (ctx.signal.aborted) break
    await sleep(1_100, ctx.signal).catch(() => undefined) // cadência Nominatim
    const geo = await geocode(statePart ? `${city}, ${statePart}` : city, params.country, ctx.signal)
    if (geo) geos.push(geo)
  }

  const seen = new Set<string>()
  let count = 0
  let anyElements = false

  for (const geo of geos) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()

    const body = await runOverpass(buildQuery(geo, nameRe, tagRe), ctx)

    let parsed: OverpassResponse
    try {
      parsed = JSON.parse(body) as OverpassResponse
    } catch {
      continue // endpoint devolveu lixo — próxima cidade
    }
    const elements = parsed.elements ?? []
    if (elements.length > 0) anyElements = true

    for (const el of elements) {
      if (ctx.signal.aborted) return
      if (count >= MAX_ELEMENTS) break
      const tags = el.tags
      const key = `${el.type ?? 'n'}/${el.id ?? ''}` || (tags?.name ?? '')
      if (!key || seen.has(key)) continue
      seen.add(key)

      const lead = elementToLead(el, `${params.niche} ${params.location}`)
      if (!lead) continue
      count += 1
      yield lead
      await sleep(30, ctx.signal).catch(() => undefined)
    }
  }

  if (count === 0) {
    throw new ProviderError(
      'overpass',
      anyElements
        ? `todos os elementos sem nome/negócio para "${params.niche}"`
        : `nenhum negócio mapeado no OpenStreetMap para "${params.niche}" em ${mainGeo.displayName.split(',')[0]}`,
    )
  }
}

export const overpassProvider: LeadProvider = {
  id: 'overpass',
  label: 'OpenStreetMap (Overpass)',
  mode: 'scrape',
  // fonte pública e gratuita: sempre live, nunca demo
  runModes: ['live'],
  requiresProxy: false,
  requiresApiKey: false,
  countries: 'global',
  costPerRequest: 0,
  note: 'base aberta OSM — cidade inteira por área, sem API key',
  search: searchLive,
}
