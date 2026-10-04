// src/core/types.ts
// Contratos centrais do Play Hot Leads. Toda fonte de dados (provider)
// implementa LeadProvider — o orquestrador não sabe se é API paga,
// scraping free ou demo; ele só consome AsyncIterable<RawLead>.

export type ProviderId =
  | 'overpass'
  | 'nominatim'
  | 'photon'
  | 'websearch'
  | 'google-places'
  | 'maps-scraper'
  | 'yelp'
  | 'yellowpages'
  | 'serpapi'
  | 'website-crawler'

/** Como o provider obtém dados. 'enrich' = roda sobre leads já capturados. */
export type ProviderMode = 'api' | 'scrape' | 'enrich'

/**
 * Demo = gera dados localizados realistas (funciona sem credenciais).
 * Live = faz chamadas HTTP reais (exige API key quando mode === 'api').
 */
export type RunMode = 'demo' | 'live'

export type CountryCode = 'BR' | 'US' | 'PT' | 'AR' | 'MX' | 'ES' | 'GB' | 'DE'

export interface SearchParams {
  niche: string
  location: string
  country: CountryCode
  /** teto global de leads únicos da busca (já deduplicado) */
  limit: number
  /** seed determinístico por busca (searchId) — pools demo frescos por busca */
  seed?: string
}

export interface ProxyConfig {
  provider: string
  host: string
  port: number
  username?: string
  password?: string
}

export interface RateLimiter {
  /** Bloqueia até haver slot disponível, respeitando cadência humana. */
  take(): Promise<void>
}

export interface ProviderContext {
  runMode: RunMode
  apiKeys: Record<string, string>
  proxy?: ProxyConfig
  rateLimiter: RateLimiter
  /** Propagado do client até o provider — cancelamento de busca. */
  signal: AbortSignal
  locale: string
}

export interface RawLead {
  source: ProviderId
  name: string
  phone?: string
  /** número aparenta ser celular → candidato a WhatsApp */
  mobile?: boolean
  email?: string
  website?: string
  mapsUrl?: string
  address?: string
  socials?: { instagram?: string; facebook?: string; linkedin?: string }
  rating?: number
  /** payload original pra debug (não persistido) */
  raw?: unknown
}

export interface LeadProvider {
  id: ProviderId
  label: string
  mode: ProviderMode
  /** modos de execução suportados: demo sempre disponível; live depende de credenciais */
  runModes: RunMode[]
  requiresProxy: boolean
  requiresApiKey: boolean
  /** ISO codes cobertos, ou 'global' */
  countries: CountryCode[] | 'global'
  /** estimativa de custo por request (USD) — exibido na UI de settings */
  costPerRequest?: number
  /** descrição curta pro painel de settings */
  note?: string
  search(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead>
  /** apenas providers mode === 'enrich' */
  enrich?(lead: RawLead, ctx: ProviderContext): Promise<EnrichmentResult>
}

export interface EnrichmentResult {
  email?: string
  socials?: { instagram?: string; facebook?: string; linkedin?: string }
  /** telefone achado no site (formato livre — o orquestrador normaliza p/ E.164) */
  phone?: string
  /** true quando o número veio de link de WhatsApp (wa.me / api.whatsapp.com) */
  whatsapp?: boolean
}

/** Erro de provider — NUNCA derruba a busca inteira (regra nº 8). */
export class ProviderError extends Error {
  readonly providerId: ProviderId
  readonly blocked: boolean
  constructor(providerId: ProviderId, message: string, blocked = false) {
    super(message)
    this.name = 'ProviderError'
    this.providerId = providerId
    this.blocked = blocked
  }
}

/* ------------------------------------------------------------------ */
/* DTOs trafegados na API/SSE (JSON-safe)                              */
/* ------------------------------------------------------------------ */

export type KanbanStage = 'new' | 'contacted' | 'negotiation' | 'won' | 'lost'

export const KANBAN_STAGES: KanbanStage[] = ['new', 'contacted', 'negotiation', 'won', 'lost']

export interface LeadDTO {
  id: string
  name: string
  phone: string | null
  phoneE164: string | null
  whatsapp: boolean
  email: string | null
  website: string | null
  mapsUrl: string | null
  address: string | null
  country: string
  socials: { instagram?: string; facebook?: string; linkedin?: string }
  rating: number | null
  sources: ProviderId[]
  dedupKey: string
  kanbanStage: KanbanStage
  contactStatus: string | null
  note: string | null
  createdAt: string
}

/** Config resolvida de um provider — trafega pro painel de settings. */
export interface ProviderConfig {
  id: ProviderId
  label: string
  mode: ProviderMode
  runModes: RunMode[]
  requiresProxy: boolean
  requiresApiKey: boolean
  countries: CountryCode[] | 'global'
  costPerRequest?: number
  note?: string
  enabled: boolean
  runMode: RunMode
  keySet: boolean
  keyHint: string | null
}

export interface ProviderRuntimeStatus {
  id: ProviderId
  status: 'waiting' | 'searching' | 'done' | 'error'
  found: number
  note?: string
}

export interface SearchStats {
  unique: number
  duplicates: number
  enriched: number
}

export interface SearchSnapshotDTO {
  id: string
  niche: string
  location: string
  country: string
  status: 'running' | 'done' | 'failed' | 'cancelled'
  stats: SearchStats
  providers: ProviderRuntimeStatus[]
  leads: LeadDTO[]
}

/* ------------------------------------------------------------------ */
/* Eventos do bus (servidor → SSE)                                     */
/* ------------------------------------------------------------------ */

export type SearchEvent =
  | { type: 'snapshot'; data: SearchSnapshotDTO }
  | { type: 'provider'; id: ProviderId; status: ProviderRuntimeStatus['status']; found?: number; note?: string }
  | { type: 'lead'; lead: LeadDTO }
  | { type: 'update'; lead: LeadDTO }
  | { type: 'dedup'; name: string; source: ProviderId }
  | { type: 'log'; line: string; tone: 'info' | 'ok' | 'warn' | 'error' }
  | { type: 'done'; stats: SearchStats }
  | { type: 'cancelled' }
  | { type: 'error'; message: string }

export type CampaignEvent = {
  type: 'progress'
  campaignId: string
  sent: number
  delivered: number
  replied: number
  status: 'running' | 'done'
}

/* ------------------------------------------------------------------ */
/* SaaS — auth, planos, pagamentos, config                             */
/* ------------------------------------------------------------------ */

export type UserRole = 'user' | 'master'
export type UserStatus = 'active' | 'blocked'
export type PaymentMethod = 'pix' | 'mercadopago' | 'credit_card' | 'asaas'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'
export type PaymentGateway = 'mercadopago' | 'asaas' | 'demo' | 'manual'

export interface UserDTO {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  credits: number
  planId: string | null
  planName: string | null
  tenantId: string
  createdAt: string
}

/** Linha da lista de usuários no painel master (com contadores de uso). */
export interface MasterUserRow extends UserDTO {
  searchesCount: number
  leadsCount: number
}

export interface PlanDTO {
  id: string
  name: string
  priceCents: number
  credits: number
  features: string[]
  active: boolean
  highlight: boolean
  sortOrder: number
}

export interface PaymentDTO {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  planId: string | null
  planName: string
  amountCents: number
  credits: number
  method: PaymentMethod
  gateway: PaymentGateway
  status: PaymentStatus
  externalId: string | null
  checkoutUrl: string | null
  createdAt: string
  paidAt: string | null
}

export interface AppConfigDTO {
  brandName: string
  /** créditos de boas-vindas de NOVOS usuários */
  defaultFreeCredits: number
  /** 'per_lead': 1 crédito por lead único entregue · 'per_search': fixo por busca */
  creditMode: 'per_lead' | 'per_search'
  /** custo por busca quando creditMode === 'per_search' */
  costPerSearch: number
  maxLeadsPerSearch: number
  allowedLimits: number[]
  signupEnabled: boolean
  maintenance: boolean
  /** URL pública do app — usada em webhook/back_urls dos gateways */
  publicUrl: string
  mercadopagoEnabled: boolean
  asaasEnabled: boolean
  asaasSandbox: boolean
}

export interface AppConfigSecretsMasked {
  mercadopagoTokenSet: boolean
  mercadopagoTokenHint: string | null
  asaasApiKeySet: boolean
  asaasApiKeyHint: string | null
}

export interface MasterOverviewDTO {
  users: { total: number; blocked: number; newLast7d: number; outstandingCredits: number }
  searches: { total: number; last24h: number }
  leads: { total: number }
  revenue: { paidCount: number; totalCents: number; last30dCents: number; pendingCents: number }
  recentPayments: PaymentDTO[]
  recentUsers: UserDTO[]
}
