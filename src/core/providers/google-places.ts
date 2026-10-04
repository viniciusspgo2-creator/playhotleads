// src/core/providers/google-places.ts
// Google Places API (New) — Text Search. Fonte "clean": dado estruturado,
// confiável. Live exige chave própria (BYOK, cifrada no settings do tenant).
// Demo: fatia do pool localizado (índices 0–7).

import { ProviderError, type LeadProvider, type RawLead, type SearchParams, type ProviderContext } from '../types'
import { buildDemoPool } from './demo-data'
import { sleep } from '../normalize'
import { fetchText } from './http'

interface PlacesResponse {
  places?: {
    displayName?: { text?: string }
    formattedAddress?: string
    rating?: number
    websiteUri?: string
    nationalPhoneNumber?: string
    internationalPhoneNumber?: string
    googleMapsUri?: string
  }[]
}

function mapPlace(place: NonNullable<PlacesResponse['places']>[number]): RawLead | null {
  const name = place.displayName?.text
  if (!name) return null
  return {
    source: 'google-places',
    name,
    phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber,
    website: place.websiteUri,
    mapsUrl: place.googleMapsUri,
    address: place.formattedAddress,
    rating: place.rating,
  }
}

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const key = ctx.apiKeys.google_places
  if (!key) throw new ProviderError('google-places', 'chave de API ausente')

  await ctx.rateLimiter.take()
  const { body } = await fetchText('google-places', 'https://places.googleapis.com/v1/places:searchText', {
    signal: ctx.signal,
    timeoutMs: 12_000,
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.googleMapsUri',
      ].join(','),
    },
    maxBytes: 800_000,
  })
  const parsed: PlacesResponse = JSON.parse(body)
  const places = parsed.places ?? []
  if (places.length === 0) {
    throw new ProviderError('google-places', 'sem resultados (verifique nicho/local)')
  }
  for (const place of places) {
    if (ctx.signal.aborted) return
    const lead = mapPlace(place)
    if (lead) yield lead
  }
}

async function* searchDemo(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const pool = buildDemoPool(params, params.seed ?? "phl-default", 20)
  for (let i = 0; i < 8; i++) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()
    await sleep(280 + Math.floor(Math.random() * 350), ctx.signal)
    const biz = pool[i]
    if (!biz) return
    yield {
      source: 'google-places',
      name: biz.name,
      phone: biz.phone,
      mobile: biz.mobile,
      email: biz.email ?? undefined,
      website: biz.website ?? undefined,
      mapsUrl: biz.mapsUrl,
      address: biz.address,
      socials: biz.socials,
      rating: biz.rating ?? undefined,
    }
  }
}

export const googlePlacesProvider: LeadProvider = {
  id: 'google-places',
  label: 'Google Places',
  mode: 'api',
  runModes: ['demo', 'live'],
  requiresProxy: false,
  requiresApiKey: true,
  countries: 'global',
  costPerRequest: 0.017,
  note: 'dado limpo e confiável (API oficial)',
  search(params, ctx) {
    return ctx.runMode === 'live' ? searchLive(params, ctx) : searchDemo(params, ctx)
  },
}
