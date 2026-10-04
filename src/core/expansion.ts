// src/core/expansion.ts
// Expansão de consultas — o multiplicador de cobertura. Uma query crua
// ("tabacaria Goiânia") encontra pouco; aqui a gente a expande para:
//
//   1. geolocalização precisa (bbox via Nominatim) → consulta espacial no Overpass
//   2. sinônimos/termos de categoria (LLM Gemini, cache 24h, fallback estático)
//   3. tags OSM equivalentes (shop=tobacco etc.) → casa negócios SEM o termo no nome
//
// Técnica inspirada nos scrapers open-source de referência (gosom/google-maps-scraper
// usa multiplicação de termos; Overpass-Turbo usa tags tipadas) — aqui nativa em TS.

import { llmComplete } from '@/lib/llm'
import type { CountryCode } from './types'

export interface GeoInfo {
  displayName: string
  lat: number
  lon: number
  /** [south, west, north, east] — formato do Overpass */
  bbox: [number, number, number, number]
  countryCode: string
  /** quando a localização é uma relation/way OSM → permite query por área (barata) */
  osmType?: 'relation' | 'way' | 'node'
  osmId?: number
}

export interface QueryExpansion {
  synonyms: string[]
  /** fragmentos de regex (lowercase) para valores das chaves shop/craft do OSM */
  osmTags: string[]
  /** cidades da região metropolitana — multiplica cobertura sem perder precisão */
  cities: string[]
  source: 'llm' | 'fallback'
}

const NOMINATIM_UA = 'PlayHotLeads/1.0 (lead generation tool; +https://playhotleads.com)'

/* ------------------------------------------------------------------ */
/* Geocoding (Nominatim — gratuito, sem key; UA obrigatório)            */
/* ------------------------------------------------------------------ */

export async function geocode(
  location: string,
  country: CountryCode,
  signal: AbortSignal,
): Promise<GeoInfo | null> {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: location,
      format: 'jsonv2',
      limit: '1',
      countrycodes: country.toLowerCase(),
    })

  try {
    const res = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(9_000)]),
      headers: { 'user-agent': NOMINATIM_UA, 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8' },
    })
    if (!res.ok) return null
    const json: unknown = await res.json()
    if (!Array.isArray(json) || json.length === 0) return null
    const item = json[0] as {
      lat?: string
      lon?: string
      boundingbox?: string[]
      display_name?: string
      addresstype?: string
      osm_type?: string
      osm_id?: number
    }
    const lat = Number(item.lat)
    const lon = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

    // Nominatim boundingbox = [south, north, west, east] → Overpass = [s, w, n, e]
    let bbox: [number, number, number, number] = [
      lat - 0.25,
      lon - 0.25,
      lat + 0.25,
      lon + 0.25,
    ]
    const bb = item.boundingbox
    if (bb && bb.length === 4) {
      const s = Number(bb[0])
      const n = Number(bb[1])
      const w = Number(bb[2])
      const e = Number(bb[3])
      if ([s, n, w, e].every(Number.isFinite)) bbox = [s, w, n, e]
    }

    return {
      displayName: item.display_name ?? location,
      lat,
      lon,
      bbox,
      countryCode: country,
      osmType: item.osm_type === 'relation' || item.osm_type === 'way' || item.osm_type === 'node'
        ? item.osm_type
        : undefined,
      osmId: typeof item.osm_id === 'number' ? item.osm_id : undefined,
    }
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Expansão semântica (LLM com cache + fallback)                        */
/* ------------------------------------------------------------------ */

interface CacheEntry {
  at: number
  value: QueryExpansion
}

const globalForExpansion = globalThis as unknown as {
  __phlExpansion?: Map<string, CacheEntry>
}

function cache(): Map<string, CacheEntry> {
  if (!globalForExpansion.__phlExpansion) {
    globalForExpansion.__phlExpansion = new Map()
  }
  return globalForExpansion.__phlExpansion
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export function expansionCacheKey(niche: string, location: string, country: string): string {
  return `${niche}|${location}|${country}`.toLowerCase()
}

/** Fallback determinístico — sem LLM a busca continua funcionando. */
function fallbackExpansion(niche: string): QueryExpansion {
  const terms = new Set<string>()
  terms.add(niche.trim())
  const lower = niche.toLowerCase()
  // heurísticas baratas: atacado/distribuição costumam dobrar cobertura
  if (!/atacado|distribuid/i.test(lower)) {
    terms.add(`${niche} atacado`)
  }
  return { synonyms: [...terms].slice(0, 4), osmTags: [], cities: [], source: 'fallback' }
}

interface LlmExpansion {
  sinonimos?: unknown
  tags_osm?: unknown
  cidades?: unknown
}

function coerceStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const clean = item.trim().replace(/\s+/g, ' ')
    if (clean.length < 2 || clean.length > 60) continue
    // sanitização: nada de caractere que quebre regex/URL de query
    if (/[<>"'`;(){}[\]]/.test(clean)) continue
    out.push(clean)
    if (out.length >= max) break
  }
  return out
}

export async function expandQueries(
  niche: string,
  location: string,
  country: CountryCode,
  signal: AbortSignal,
): Promise<QueryExpansion> {
  const key = expansionCacheKey(niche, location, country)
  const hit = cache().get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    // entradas antigas podem não ter 'cities' — normaliza
    if (!Array.isArray(hit.value.cities)) hit.value.cities = []
    return hit.value
  }

  try {
    const content = await llmComplete({
      json: true,
      timeoutMs: 14_000,
      system:
        'Você é especialista em prospecção B2B e bases de dados do OpenStreetMap. ' +
              'Dado um nicho de negócio e uma localidade, devolva SOMENTE um JSON válido (sem markdown, sem comentários) com:\n' +
              '{"sinonimos": ["..."], "tags_osm": ["..."], "cidades": ["..."]}\n' +
              'sinonimos: de 6 a 10 termos de busca que revelam esse tipo de negócio — sinônimos, ' +
              'categoria, produto principal e gírias do setor (ex.: tabacaria → vape, cigarro eletrônico, ' +
              'narguilé, hookah, head shop, fumaria). Termos curtos, sem nome de cidade.\n' +
              'tags_osm: de 0 a 4 fragmentos de REGEX (minúsculas, sem aspas) para VALORES das chaves ' +
              'shop/craft/amenity do OpenStreetMap que representam o nicho (ex.: tabacaria → ["tobacco", ' +
              '"e.?cigarette|vape", "hookah|shisha|waterpipe"]). Use [] se não houver.\n' +
              'cidades: de 0 a 4 cidades da região metropolitana da localidade (NÃO inclua a própria). ' +
              'Use [] se não souber.',
      user: `nicho: ${niche}\nlocal: ${location}\npaís: ${country}`,
    })

    const stripped = content.replace(/```(?:json)?/gi, '').trim()
    const start = stripped.indexOf('{')
    const end = stripped.lastIndexOf('}')
    if (start === -1 || end <= start) throw new Error('resposta do LLM sem JSON')

    const parsed = JSON.parse(stripped.slice(start, end + 1)) as LlmExpansion
    const synonyms = coerceStringArray(parsed.sinonimos, 10)
    const osmTags = coerceStringArray(parsed.tags_osm, 4)
    const cities = coerceStringArray(parsed.cidades, 4)
    if (synonyms.length === 0) throw new Error('LLM devolveu lista vazia')

    // o termo original sempre entra — os sinônimos são adição, não substituição
    const all = [niche.trim(), ...synonyms.filter((s) => s.toLowerCase() !== niche.trim().toLowerCase())]
    const value: QueryExpansion = {
      synonyms: all.slice(0, 11),
      osmTags,
      cities,
      source: 'llm',
    }
    cache().set(key, { at: Date.now(), value })
    return value
  } catch {
    const value = fallbackExpansion(niche)
    cache().set(key, { at: Date.now(), value })
    return value
  }
}

/** Expansão compartilhada — 1 chamada LLM por (nicho, local, país) serve a todos os providers. */
export async function sharedExpansion(
  niche: string,
  location: string,
  country: CountryCode,
  signal: AbortSignal,
): Promise<QueryExpansion> {
  return expandQueries(niche, location, country, signal)
}
