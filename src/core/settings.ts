// src/core/settings.ts
// Carga/salvamento das settings do tenant com segredos cifrados em repouso.
// API de settings e orquestrador passam por aqui — nunca leem o encrypted
// blob direto.

import { db } from '@/lib/db'
import { decryptJson, encryptJson } from './crypto'
import type { ProviderConfig } from './types'
import { PROVIDERS } from './providers/registry'
import type { CountryCode, ProxyConfig, ProviderId, RunMode } from './types'

export interface ResolvedSettings {
  enabled: Record<ProviderId, boolean>
  modes: Record<ProviderId, RunMode>
  /** segredos decifrados — NUNCA ir pro client */
  apiKeys: Record<string, string>
  proxy: ProxyConfig | null
  language: 'pt' | 'en' | 'es'
}

const DEFAULT_ENABLED: Record<ProviderId, boolean> = {
  // padrão: só fontes 100% reais e gratuitas — zero dado sintético por default
  overpass: true,
  nominatim: true,
  photon: true,
  websearch: true,
  'google-places': false,
  'maps-scraper': false,
  yelp: false,
  yellowpages: false,
  'website-crawler': true,
  serpapi: false,
}

const DEFAULT_MODES: Record<ProviderId, RunMode> = {
  // fontes gratuitas (sem credencial) sempre live — não existe demo pra elas
  overpass: 'live',
  nominatim: 'live',
  photon: 'live',
  websearch: 'live',
  'google-places': 'demo',
  'maps-scraper': 'demo',
  yelp: 'demo',
  yellowpages: 'demo',
  'website-crawler': 'live',
  serpapi: 'demo',
}

export async function loadSettings(tenantId: string): Promise<ResolvedSettings> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  })
  const row = tenant?.settings

  const enabled = { ...DEFAULT_ENABLED }
  if (row?.enabledProviders) {
    try {
      Object.assign(enabled, JSON.parse(row.enabledProviders) as Partial<Record<ProviderId, boolean>>)
    } catch { /* defaults */ }
  }

  const modes = { ...DEFAULT_MODES }
  if (row?.providerModes) {
    try {
      Object.assign(modes, JSON.parse(row.providerModes) as Partial<Record<ProviderId, RunMode>>)
    } catch { /* defaults */ }
  }

  const apiKeys = row ? decryptJson<Record<string, string>>(row.apiKeysEnc, {}) : {}
  const proxy = row ? decryptJson<ProxyConfig | null>(row.proxyEnc, null) : null

  const language = tenant?.language === 'en' || tenant?.language === 'es' ? tenant.language : 'pt'

  return { enabled, modes, apiKeys, proxy, language }
}

export interface SettingsPatch {
  enabled?: Partial<Record<ProviderId, boolean>>
  modes?: Partial<Record<ProviderId, RunMode>>
  /** patch parcial: chaves não enviadas são preservadas; string vazia apaga */
  apiKeys?: Record<string, string>
  /** null = limpar proxy; objeto = substituir */
  proxy?: ProxyConfig | null
  language?: 'pt' | 'en' | 'es'
}

export async function saveSettings(tenantId: string, patch: SettingsPatch): Promise<ResolvedSettings> {
  const current = await loadSettings(tenantId)

  const enabled = { ...current.enabled, ...(patch.enabled ?? {}) }
  const modes = { ...current.modes, ...(patch.modes ?? {}) }
  const language = patch.language ?? current.language

  const apiKeys = { ...current.apiKeys }
  for (const [key, value] of Object.entries(patch.apiKeys ?? {})) {
    if (value === '') delete apiKeys[key]
    else apiKeys[key] = value
  }

  const proxy =
    patch.proxy === undefined ? current.proxy : patch.proxy === null ? null : patch.proxy

  // sanity: só ids conhecidos
  const knownIds = new Set(PROVIDERS.map((p) => p.id as string))
  const cleanEnabled: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(enabled)) if (knownIds.has(k)) cleanEnabled[k] = Boolean(v)
  const cleanModes: Record<string, RunMode> = {}
  for (const [k, v] of Object.entries(modes)) if (knownIds.has(k) && (v === 'demo' || v === 'live')) cleanModes[k] = v

  await db.tenantSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      enabledProviders: JSON.stringify(cleanEnabled),
      providerModes: JSON.stringify(cleanModes),
      apiKeysEnc: encryptJson(apiKeys),
      proxyEnc: proxy ? encryptJson(proxy) : '',
    },
    update: {
      enabledProviders: JSON.stringify(cleanEnabled),
      providerModes: JSON.stringify(cleanModes),
      apiKeysEnc: encryptJson(apiKeys),
      proxyEnc: proxy ? encryptJson(proxy) : '',
    },
  })

  await db.tenant.update({ where: { id: tenantId }, data: { language } })

  return { enabled, modes, apiKeys, proxy, language }
}

/** ProviderConfig derivada das settings — usada pelo painel de UI. */
export function providerConfigList(settings: ResolvedSettings): ProviderConfig[] {
  return PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    mode: p.mode,
    runModes: p.runModes,
    requiresProxy: p.requiresProxy,
    requiresApiKey: p.requiresApiKey,
    countries: p.countries,
    costPerRequest: p.costPerRequest,
    note: p.note,
    enabled: settings.enabled[p.id] ?? false,
    runMode: settings.modes[p.id] ?? 'demo',
    keySet: p.id === 'serpapi' ? Boolean(settings.apiKeys.serpapi) : p.id === 'google-places' ? Boolean(settings.apiKeys.google_places) : false,
    keyHint: p.id === 'serpapi'
      ? maskHint(settings.apiKeys.serpapi)
      : p.id === 'google-places'
        ? maskHint(settings.apiKeys.google_places)
        : null,
  }))
}

function maskHint(secret: string | undefined): string | null {
  if (!secret) return null
  return `•••••${secret.slice(-4)}`
}

export function maskProxy(proxy: ProxyConfig | null): {
  provider: string
  host: string
  port: number
  username: string | null
  passwordSet: boolean
} | null {
  if (!proxy) return null
  return {
    provider: proxy.provider,
    host: proxy.host,
    port: proxy.port,
    username: proxy.username ?? null,
    passwordSet: Boolean(proxy.password),
  }
}

export type { CountryCode }
