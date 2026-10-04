// src/core/appconfig.ts
// Config global do SaaS (persistida em AppConfig, key='global'). Valores
// públicos em JSON plano; segredos de gateway cifrados com AES-256-GCM.
// Cache em memória com TTL curto — o master edita e o efeito é imediato.

import { db } from '@/lib/db'
import { decryptJson, encryptJson, maskSecret } from './crypto'
import type { AppConfigDTO, AppConfigSecretsMasked } from './types'

const KEY = 'global'

export interface AppSecrets {
  mercadopagoToken?: string
  asaasApiKey?: string
}

export const DEFAULT_CONFIG: AppConfigDTO = {
  brandName: 'Play Hot Leads',
  defaultFreeCredits: 150,
  creditMode: 'per_lead',
  costPerSearch: 10,
  maxLeadsPerSearch: 300,
  allowedLimits: [30, 80, 150, 300],
  signupEnabled: true,
  maintenance: false,
  publicUrl: '',
  mercadopagoEnabled: false,
  asaasEnabled: false,
  asaasSandbox: true,
}

export const DEFAULT_SECRETS: AppSecrets = {}

interface CacheEntry {
  at: number
  config: AppConfigDTO
  secrets: AppSecrets
}

const TTL_MS = 5_000
let cache: CacheEntry | null = null

function sanitize(raw: Partial<AppConfigDTO> | null | undefined): AppConfigDTO {
  const merged: AppConfigDTO = { ...DEFAULT_CONFIG, ...(raw ?? {}) }
  // guarda-chuvas de sanidade — o master pode errar sem quebrar o app
  merged.defaultFreeCredits = Math.max(0, Math.floor(merged.defaultFreeCredits) || 0)
  merged.costPerSearch = Math.max(1, Math.floor(merged.costPerSearch) || DEFAULT_CONFIG.costPerSearch)
  merged.maxLeadsPerSearch = Math.min(1000, Math.max(10, Math.floor(merged.maxLeadsPerSearch) || 300))
  merged.allowedLimits = Array.isArray(merged.allowedLimits) && merged.allowedLimits.length > 0
    ? [...new Set(merged.allowedLimits.map((n) => Math.floor(Number(n)) || 0))].filter((n) => n >= 5 && n <= merged.maxLeadsPerSearch).sort((a, b) => a - b)
    : DEFAULT_CONFIG.allowedLimits
  merged.brandName = merged.brandName.trim().slice(0, 40) || DEFAULT_CONFIG.brandName
  merged.publicUrl = merged.publicUrl.trim().slice(0, 200)
  merged.creditMode = merged.creditMode === 'per_search' ? 'per_search' : 'per_lead'
  return merged
}

async function load(): Promise<CacheEntry> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache
  const row = await db.appConfig.findUnique({ where: { key: KEY } })
  const entry: CacheEntry = {
    at: Date.now(),
    config: sanitize(row ? (JSON.parse(row.value) as Partial<AppConfigDTO>) : null),
    secrets: row ? decryptJson<AppSecrets>(row.secretsEnc, DEFAULT_SECRETS) : DEFAULT_SECRETS,
  }
  cache = entry
  return entry
}

export async function getAppConfig(): Promise<AppConfigDTO> {
  return (await load()).config
}

export async function getAppSecrets(): Promise<AppSecrets> {
  return (await load()).secrets
}

export async function updateAppConfig(patch: Partial<AppConfigDTO>): Promise<AppConfigDTO> {
  const current = await getAppConfig()
  const next = sanitize({ ...current, ...patch })
  const secrets = await getAppSecrets()
  await db.appConfig.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(next), secretsEnc: encryptJson(secrets) },
    update: { value: JSON.stringify(next), secretsEnc: encryptJson(secrets) },
  })
  cache = { at: Date.now(), config: next, secrets }
  return next
}

/** Patch parcial: campo ausente preserva; string vazia apaga o segredo. */
export async function updateAppSecrets(patch: Partial<AppSecrets>): Promise<AppSecrets> {
  const current = await getAppSecrets()
  const next: AppSecrets = { ...current }
  if (patch.mercadopagoToken !== undefined) {
    if (patch.mercadopagoToken === '') delete next.mercadopagoToken
    else next.mercadopagoToken = patch.mercadopagoToken
  }
  if (patch.asaasApiKey !== undefined) {
    if (patch.asaasApiKey === '') delete next.asaasApiKey
    else next.asaasApiKey = patch.asaasApiKey
  }
  const config = await getAppConfig()
  await db.appConfig.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(config), secretsEnc: encryptJson(next) },
    update: { value: JSON.stringify(config), secretsEnc: encryptJson(next) },
  })
  cache = { at: Date.now(), config, secrets: next }
  return next
}

export function maskSecrets(secrets: AppSecrets): AppConfigSecretsMasked {
  return {
    mercadopagoTokenSet: Boolean(secrets.mercadopagoToken),
    mercadopagoTokenHint: maskSecret(secrets.mercadopagoToken),
    asaasApiKeySet: Boolean(secrets.asaasApiKey),
    asaasApiKeyHint: maskSecret(secrets.asaasApiKey),
  }
}

/** Invalida cache (útil após webhooks/testes). */
export function invalidateConfigCache(): void {
  cache = null
}
