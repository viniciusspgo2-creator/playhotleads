// src/core/providers/registry.ts
// O Provider Registry — adicionar fonte nova = criar 1 arquivo e registrar
// aqui. O resto do sistema nem muda.

import type { LeadProvider, ProviderId, RunMode } from '../types'
import { overpassProvider } from './overpass'
import { nominatimProvider } from './nominatim'
import { photonProvider } from './photon'
import { websearchProvider } from './websearch'
import { googlePlacesProvider } from './google-places'
import { mapsScraperProvider } from './maps-scraper'
import { yelpProvider } from './yelp'
import { yellowpagesProvider } from './yellowpages'
import { serpapiProvider } from './serpapi'
import { websiteCrawlerProvider } from './website-crawler'

export const PROVIDERS: LeadProvider[] = [
  // Fontes gratuitas sem credencial primeiro — abertura da busca não depende de API key
  overpassProvider,
  nominatimProvider,
  photonProvider,
  websearchProvider,
  googlePlacesProvider,
  mapsScraperProvider,
  yelpProvider,
  yellowpagesProvider,
  serpapiProvider,
  websiteCrawlerProvider,
]

const BY_ID = new Map<ProviderId, LeadProvider>(PROVIDERS.map((p) => [p.id, p]))

export function getProvider(id: ProviderId): LeadProvider | undefined {
  return BY_ID.get(id)
}

/** Providers de busca (exclui enrich) — a ordem define prioridade na UI. */
export function searchProviders(): LeadProvider[] {
  return PROVIDERS.filter((p) => p.mode !== 'enrich')
}

export function providerSupportsCountry(p: LeadProvider, country: string): boolean {
  return p.countries === 'global' || p.countries.includes(country as never)
}

/** Modo efetivo: live só se o provider suportar E tiver credencial quando exige. */
export function effectiveRunMode(
  p: LeadProvider,
  requested: RunMode,
  apiKeys: Record<string, string>,
): RunMode {
  if (requested === 'live' && p.requiresApiKey) {
    const keyName = p.id === 'serpapi' ? 'serpapi' : 'google_places'
    if (!apiKeys[keyName]) return 'demo'
  }
  return p.runModes.includes(requested) ? requested : 'demo'
}
