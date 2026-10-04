// src/core/orchestrator.ts
// O cérebro: dispara todos os providers habilitados EM PARALELO, normaliza,
// deduplica no nível do banco (unique tenant+dedupKey), enfileira
// enriquecimento e emite tudo pro bus (SSE). Erro de um provider NUNCA
// derruba a busca — Promise.allSettled por provider.
//
// Cancelamento: AbortController por busca, propagado até os providers
// (ctx.signal) e checado entre cada lead.

import { db } from '@/lib/db'
import { flushSearchEvents, publishSearch, pruneSearchEvents } from '@/lib/bus'
import { drainQueue, enqueueJob } from './queue'
import { getRateLimiter } from './rate-limit'
import { toLeadDTO } from './dto'
import { loadSettings } from './settings'
import {
  buildDedupKey,
  domainFromUrl,
  normalizeName,
  parsePhone,
  sleep,
} from './normalize'
import { searchProviders, getProvider, providerSupportsCountry, effectiveRunMode } from './providers/registry'
import type {
  CountryCode,
  LeadDTO,
  ProviderId,
  ProviderRuntimeStatus,
  RawLead,
  SearchParams,
  SearchStats,
} from './types'
import { KANBAN_STAGES } from './types'

/* ------------------------------------------------------------------ */
/* Runtime por busca (snapshot pra reconexão de SSE)                    */
/* ------------------------------------------------------------------ */

interface SearchRuntime {
  providers: Map<ProviderId, ProviderRuntimeStatus>
  stats: SearchStats
  leads: LeadDTO[]
  status: 'running' | 'done' | 'failed' | 'cancelled'
}

const globalForOrch = globalThis as unknown as {
  __phlOrch?: {
    runtimes: Map<string, SearchRuntime>
    controllers: Map<string, AbortController>
  }
}

function orchState() {
  if (!globalForOrch.__phlOrch) {
    globalForOrch.__phlOrch = { runtimes: new Map(), controllers: new Map() }
  }
  return globalForOrch.__phlOrch
}

export function getSnapshot(searchId: string): SearchRuntime | null {
  return orchState().runtimes.get(searchId) ?? null
}

/* ------------------------------------------------------------------ */
/* Cancelamento                                                         */
/* ------------------------------------------------------------------ */

export async function cancelSearch(searchId: string): Promise<void> {
  const controller = orchState().controllers.get(searchId)
  controller?.abort()

  const runtime = orchState().runtimes.get(searchId)
  if (runtime) runtime.status = 'cancelled'

  await db.search.updateMany({
    where: { id: searchId, status: 'running' },
    data: { status: 'cancelled', finishedAt: new Date() },
  })
  publishSearch(searchId, { type: 'cancelled' })
  await flushSearchEvents(searchId)
}

/* ------------------------------------------------------------------ */
/* Start                                                                */
/* ------------------------------------------------------------------ */

export interface StartSearchArgs {
  searchId: string
  tenantId: string
  params: SearchParams
  /**
   * Teto de leads únicos por CRÉDITOS do usuário (1 crédito = 1 lead).
   * null = ilimitado (master). A busca para graciosamente ao esgotar.
   */
  creditBudget?: number | null
  /**
   * Usuário que PAGA 1 crédito por lead único criado (modo per_lead).
   * null/ausente = sem débito (master ou modo per_search já cobrado à frente).
   */
  chargeUserId?: string | null
}

/**
 * Orçamento de tempo da busca. A rota define maxDuration = 300s; paramos
 * antes (graciosamente, status "done" com o que foi coletado) para dar
 * tempo de enriquecer, gravar o status final e esvaziar os eventos.
 */
export const SEARCH_BUDGET_MS = 255_000

/**
 * Executa a busca INTEIRA e só resolve quando termina. Pensado para rodar
 * dentro de `after()` (Vercel): a função fica viva até esta promise acabar.
 *
 * - cancelamento entre instâncias: o DELETE grava status "cancelled" no
 *   banco; um watcher aqui consulta o banco e aborta o controller local.
 * - estouro de tempo: aborta providers e conclui como "done" (parcial).
 */
export async function executeSearch(args: StartSearchArgs): Promise<void> {
  const controller = new AbortController()
  orchState().controllers.set(args.searchId, controller)

  let timedOut = false
  const budgetTimer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, SEARCH_BUDGET_MS)

  const cancelWatcher = setInterval(() => {
    void db.search
      .findUnique({ where: { id: args.searchId }, select: { status: true } })
      .then((row) => {
        if (row?.status === 'cancelled') controller.abort()
      })
      .catch(() => undefined)
  }, 3_000)

  void pruneSearchEvents()

  try {
    await runSearch(args, controller.signal, () => timedOut)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.search
      .updateMany({
        where: { id: args.searchId, status: 'running' },
        data: { status: 'failed', error: message, finishedAt: new Date() },
      })
      .catch(() => undefined)
    publishSearch(args.searchId, { type: 'error', message })
  } finally {
    clearTimeout(budgetTimer)
    clearInterval(cancelWatcher)
    orchState().controllers.delete(args.searchId)
    // em serverless não existe "depois": garante que tudo foi gravado
    await drainQueue(15_000)
    await flushSearchEvents(args.searchId)
    // runtime em memória só serve durante a execução
    setTimeout(() => orchState().runtimes.delete(args.searchId), 60_000)
  }
}

/* ------------------------------------------------------------------ */
/* Execução                                                             */
/* ------------------------------------------------------------------ */

async function runSearch(
  args: StartSearchArgs,
  signal: AbortSignal,
  wasTimeout: () => boolean,
): Promise<void> {
  const { searchId, tenantId, params, creditBudget, chargeUserId } = args

  const settings = await loadSettings(tenantId)
  const searchRow = await db.search.findUnique({ where: { id: searchId } })

  const runtime: SearchRuntime = {
    providers: new Map(),
    stats: { unique: 0, duplicates: 0, enriched: 0 },
    leads: [],
    status: 'running',
  }
  orchState().runtimes.set(searchId, runtime)

  const searchProvidersAll = searchProviders()
  const candidates = searchProvidersAll.filter(
    (p) => (settings.enabled[p.id] ?? false) && providerSupportsCountry(p, params.country),
  )
  // Modo demo SEM credencial não entra na busca: dado sintético jamais se
  // mistura a resultado real (a queixa nº 1 de qualidade). Fontes gratuitas
  // (runModes ['live']) resolvem 'live' sem credencial — sempre entram.
  const enabled = candidates.filter(
    (p) => effectiveRunMode(p, settings.modes[p.id] ?? 'demo', settings.apiKeys) !== 'demo',
  )
  const skippedDemo = candidates.filter((p) => !enabled.includes(p))
  const crawler = getProvider('website-crawler')
  const crawlerEnabled = Boolean(crawler && settings.enabled['website-crawler'])

  // status inicial dos providers
  for (const p of searchProvidersAll) {
    const isActive = enabled.includes(p)
    const isSkipped = skippedDemo.includes(p)
    runtime.providers.set(p.id, {
      id: p.id,
      status: isActive ? 'searching' : 'waiting',
      found: 0,
      note: isActive ? undefined : isSkipped ? 'modo demo sem credencial — pulado' : 'desativado',
    })
  }

  publishSearch(searchId, {
    type: 'log',
    line: `orquestrador ▶ "${params.niche}" @ ${params.location} (${params.country})`,
    tone: 'ok',
  })
  publishSearch(searchId, {
    type: 'log',
    line: `${enabled.length} providers habilitados · proxy ${settings.proxy ? 'on' : 'off'} · limit ${params.limit}`,
    tone: 'info',
  })
  for (const p of enabled) {
    publishSearch(searchId, { type: 'provider', id: p.id, status: 'searching' })
  }

  if (enabled.length === 0) {
    await failSearch(
      searchId,
      runtime,
      skippedDemo.length > 0
        ? 'fontes pagas sem credencial (modo demo pulado) — ative as fontes gratuitas em Ajustes ou insira uma API key'
        : 'nenhum provider habilitado para este país — ative fontes em Ajustes',
    )
    return
  }

  try {
    // Dispara TODAS as fontes em paralelo, cada uma isolada
    const consumers = enabled.map((p) =>
      consumeProvider({
        providerId: p.id,
        tenantId,
        searchId,
        params,
        settings,
        runtime,
        signal,
        creditBudget: creditBudget ?? null,
        chargeUserId: chargeUserId ?? null,
      }),
    )
    await Promise.allSettled(consumers)
  } catch (err) {
    // nunca deve chegar aqui (allSettled), mas defensivamente:
    await failSearch(searchId, runtime, err instanceof Error ? err.message : String(err))
    return
  }

  if (signal.aborted && !wasTimeout()) {
    runtime.status = 'cancelled'
    return // cancelSearch já atualizou o banco e emitiu o evento
  }

  if (wasTimeout()) {
    publishSearch(searchId, {
      type: 'log',
      line: 'limite de tempo da execução atingido — resultado parcial entregue',
      tone: 'warn',
    })
  }

  // aguarda o enriquecimento (crawl) pendente — em serverless não há "depois"
  await drainQueue(20_000)

  runtime.status = 'done'
  await db.search.update({
    where: { id: searchId },
    data: {
      status: 'done',
      totalFound: runtime.stats.unique,
      duplicates: runtime.stats.duplicates,
      finishedAt: new Date(),
    },
  })
  publishSearch(searchId, { type: 'provider', id: 'website-crawler', status: crawlerEnabled ? 'searching' : 'waiting', found: runtime.stats.enriched })
  publishSearch(searchId, { type: 'done', stats: { ...runtime.stats } })
  publishSearch(searchId, {
    type: 'log',
    line: `busca concluída · ${runtime.stats.unique} únicos · ${runtime.stats.duplicates} duplicados · ${runtime.stats.enriched} enriquecidos`,
    tone: 'ok',
  })
}

/* ------------------------------------------------------------------ */
/* Consumo de um provider (isolado)                                     */
/* ------------------------------------------------------------------ */

interface ConsumeArgs {
  providerId: ProviderId
  tenantId: string
  searchId: string
  params: SearchParams
  settings: Awaited<ReturnType<typeof loadSettings>>
  runtime: SearchRuntime
  signal: AbortSignal
  /** teto por créditos do usuário (null = master/ilimitado) */
  creditBudget: number | null
  /** usuário debitado por lead único (null = sem débito) */
  chargeUserId: string | null
}

async function consumeProvider(args: ConsumeArgs): Promise<void> {
  const { providerId, tenantId, searchId, params, settings, runtime, signal, creditBudget, chargeUserId } = args
  const provider = getProvider(providerId)
  if (!provider) return

  const requestedMode = settings.modes[providerId] ?? 'demo'
  const runMode = effectiveRunMode(provider, requestedMode, settings.apiKeys)

  if (runMode === 'demo') {
    // segunda linha de defesa: demo não gera lead em busca real
    const st = runtime.providers.get(providerId)
    if (st) {
      st.status = 'waiting'
      st.note = 'modo demo sem credencial — pulado (busca só com dado real)'
    }
    publishSearch(searchId, { type: 'provider', id: providerId, status: 'waiting', note: 'demo pulado' })
    publishSearch(searchId, {
      type: 'log',
      line: `${providerId} ▸ pulado — sem credencial, modo demo não entra em busca real`,
      tone: 'warn',
    })
    return
  }

  try {
    for await (const raw of provider.search(params, {
      runMode,
      apiKeys: settings.apiKeys,
      proxy: settings.proxy ?? undefined,
      rateLimiter: getRateLimiter(providerId),
      signal,
      locale: settings.language,
    })) {
      if (signal.aborted) return
      if (runtime.stats.unique >= params.limit) {
        publishSearch(searchId, { type: 'log', line: `limite de ${params.limit} atingido — ${providerId} interrompido`, tone: 'warn' })
        return
      }
      if (creditBudget !== null && runtime.stats.unique >= creditBudget) {
        publishSearch(searchId, { type: 'log', line: `créditos esgotados (${creditBudget}) — ${providerId} interrompido`, tone: 'warn' })
        return
      }
      await handleRawLead({ raw, tenantId, searchId, params, runtime, signal, creditBudget, chargeUserId })
      await sleep(60, signal)
    }

    const st = runtime.providers.get(providerId)
    if (st && st.status === 'searching') {
      st.status = 'done'
      publishSearch(searchId, { type: 'provider', id: providerId, status: 'done', found: st.found })
    }
  } catch (err) {
    if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      const st = runtime.providers.get(providerId)
      if (st && st.status === 'searching') {
        st.status = 'done'
        publishSearch(searchId, { type: 'provider', id: providerId, status: 'done', found: st.found })
      }
      return
    }
    const message = err instanceof Error ? err.message : String(err)
    const st = runtime.providers.get(providerId)
    if (st) {
      st.status = 'error'
      st.note = message
    }
    publishSearch(searchId, { type: 'provider', id: providerId, status: 'error', note: message })
    publishSearch(searchId, {
      type: 'log',
      line: `${providerId} ✖ ${message} — provider isolado, busca continua`,
      tone: 'warn',
    })
  }
}

/* ------------------------------------------------------------------ */
/* Normalização + dedup + persistência                                  */
/* ------------------------------------------------------------------ */

interface HandleArgs {
  raw: RawLead
  tenantId: string
  searchId: string
  params: SearchParams
  runtime: SearchRuntime
  signal: AbortSignal
  /** teto por créditos do usuário (null = master/ilimitado) */
  creditBudget: number | null
  /** usuário debitado por lead único (null = sem débito) */
  chargeUserId: string | null
}

async function handleRawLead(args: HandleArgs): Promise<void> {
  const { raw, tenantId, searchId, params, runtime, creditBudget, chargeUserId } = args

  const name = raw.name.trim()
  if (name.length < 2) return

  const parsed = raw.phone ? parsePhone(raw.phone, params.country) : null
  const email = raw.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw.email) ? raw.email.toLowerCase() : null
  const domain = domainFromUrl(raw.website)
  const normalizedName = normalizeName(name)
  const dedupKey = buildDedupKey({ phoneE164: parsed?.e164, domain, normalizedName })

  // Dedup multi-camada (fontes diferentes raramente concordam na chave):
  //   1. dedupKey exata (phone|domain|nome)
  //   2. mesmo domínio de site
  //   3. mesmo telefone E.164
  //   4. mesmo nome normalizado no mesmo país (última defesa)
  const existing =
    (await db.lead.findUnique({
      where: { tenantId_dedupKey: { tenantId, dedupKey } },
    })) ??
    (domain ? await db.lead.findFirst({ where: { tenantId, domain } }) : null) ??
    (parsed?.e164 ? await db.lead.findFirst({ where: { tenantId, phoneE164: parsed.e164 } }) : null) ??
    (await db.lead.findFirst({ where: { tenantId, normalizedName, country: params.country } }))

  if (existing) {
    // merge multi-fonte: soma sources, preenche buracos (inclui socials)
    const prevSources = safeParseStringArray(existing.sources)
    const mergedSources = [...new Set([...prevSources, raw.source])]
    const mergedSocials = {
      ...safeParseSocials(existing.socials),
      ...(raw.socials ?? {}),
    }
    const updated = await db.lead.update({
      where: { id: existing.id },
      data: {
        sources: JSON.stringify(mergedSources),
        socials: JSON.stringify(mergedSocials),
        domain: existing.domain ?? domain,
        whatsapp: existing.whatsapp || (parsed?.isMobile || raw.mobile === true),
        email: existing.email ?? email,
        website: existing.website ?? raw.website ?? null,
        mapsUrl: existing.mapsUrl ?? raw.mapsUrl ?? null,
        address: existing.address ?? raw.address ?? null,
        rating: existing.rating ?? raw.rating ?? null,
        phoneE164: existing.phoneE164 ?? parsed?.e164 ?? null,
        phone: existing.phone ?? parsed?.intl ?? null,
      },
    })
    runtime.stats.duplicates += 1
    const st = runtime.providers.get(raw.source)
    if (st) st.found += 1
    publishSearch(searchId, { type: 'provider', id: raw.source, status: 'searching', found: st?.found })
    publishSearch(searchId, {
      type: 'dedup',
      name,
      source: raw.source,
    })
    publishSearch(searchId, { type: 'log', line: `dedup ▸ "${name}" já existe (${raw.source}) — mesclado`, tone: 'warn' })
    runtime.leads = runtime.leads.map((l) => (l.id === updated.id ? toLeadDTO(updated) : l))
    publishSearch(searchId, { type: 'update', lead: toLeadDTO(updated) })

    // merge pode ter trazido site (antes inexistente) e o lead segue sem e-mail ou telefone
    if (updated.website && (!updated.email || !updated.phoneE164)) {
      enqueueEnrichment(updated.id, tenantId, searchId)
    }
    return
  }

  // Débito de crédito (modo per_lead): 1 crédito = 1 lead único entregue.
  // Atômico (updateMany condicional) — providers concorrentes não estouram o
  // saldo. Se o create cair em race de dedup, devolve o crédito.
  if (chargeUserId) {
    const charged = await db.user.updateMany({
      where: { id: chargeUserId, credits: { gt: 0 } },
      data: { credits: { decrement: 1 } },
    })
    if (charged.count === 0) {
      publishSearch(searchId, { type: 'log', line: 'créditos esgotados no meio da busca — recarregue em Planos', tone: 'warn' })
      return
    }
  }

  const created = await db.lead.create({
    data: {
      tenantId,
      searchId,
      name,
      normalizedName,
      phone: parsed?.intl ?? null,
      phoneE164: parsed?.e164 ?? null,
      whatsapp: (parsed?.isMobile || raw.mobile === true) ?? false,
      email,
      website: raw.website ?? null,
      domain,
      mapsUrl: raw.mapsUrl ?? null,
      address: raw.address ?? null,
      country: params.country,
      socials: JSON.stringify(raw.socials ?? {}),
      rating: raw.rating ?? null,
      sources: JSON.stringify([raw.source]),
      dedupKey,
      kanbanStage: 'new',
    },
  }).catch(async (err: unknown) => {
    // race: outro provider criou o mesmo lead entre findUnique e create
    if (isUniqueViolation(err)) {
      const loser = await db.lead.findUnique({ where: { tenantId_dedupKey: { tenantId, dedupKey } } })
      if (loser) {
        if (chargeUserId) {
          await db.user.update({ where: { id: chargeUserId }, data: { credits: { increment: 1 } } }).catch(() => undefined)
        }
        runtime.stats.duplicates += 1
        publishSearch(searchId, { type: 'dedup', name, source: raw.source })
        return loser
      }
    }
    throw err
  })

  if (created.id !== undefined && runtime.leads.some((l) => l.id === created.id)) {
    return
  }

  runtime.stats.unique += 1
  const st = runtime.providers.get(raw.source)
  if (st) {
    st.found += 1
    publishSearch(searchId, { type: 'provider', id: raw.source, status: 'searching', found: st.found })
  }
  const dto = toLeadDTO(created)
  runtime.leads = [dto, ...runtime.leads].slice(0, 200)
  publishSearch(searchId, { type: 'lead', lead: dto })
  publishSearch(searchId, {
    type: 'log',
    line: `${raw.source} · lead "${name}"${raw.rating ? ` ★${raw.rating}` : ''}`,
    tone: 'info',
  })

  // se tem site mas falta e-mail OU telefone → worker de enriquecimento
  if (created.website && (!created.email || !created.phoneE164)) {
    enqueueEnrichment(created.id, tenantId, searchId)
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  )
}

function safeParseStringArray(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function safeParseSocials(json: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

/* ------------------------------------------------------------------ */
/* Enriquecimento (fila)                                                */
/* ------------------------------------------------------------------ */

const enrichDebounce = new Set<string>()

export function enqueueEnrichment(leadId: string, tenantId: string, searchId: string): void {
  if (enrichDebounce.has(leadId)) return
  enrichDebounce.add(leadId)

  enqueueJob(
    async () => {
      const crawler = getProvider('website-crawler')
      if (!crawler?.enrich) return
      const settings = await loadSettings(tenantId)
      if (!settings.enabled['website-crawler']) return

      const lead = await db.lead.findUnique({ where: { id: leadId } })
      if (!lead || !lead.website) return
      // nada a buscar se já tem e-mail E telefone/whatsapp
      if (lead.email && (lead.phoneE164 || lead.whatsapp)) return

      publishSearch(searchId, { type: 'log', line: `fila ▸ crawl de ${lead.domain ?? lead.website}`, tone: 'info' })

      const rawLead: RawLead = { source: 'website-crawler', name: lead.name, website: lead.website }
      const result = await crawler.enrich(rawLead, {
        runMode: settings.modes['website-crawler'] ?? 'live',
        apiKeys: {},
        proxy: settings.proxy ?? undefined,
        rateLimiter: getRateLimiter('website-crawler'),
        signal: new AbortController().signal,
        locale: settings.language,
      })

      const email = result.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(result.email) ? result.email.toLowerCase() : null
      const parsedPhone = result.phone ? parsePhone(result.phone, lead.country as CountryCode) : null
      const foundPhone = !lead.phoneE164 && parsedPhone ? parsedPhone : null
      const foundWhatsapp = Boolean(result.whatsapp) || Boolean(parsedPhone?.isMobile)
      const prevSocials = (() => {
        try {
          return JSON.parse(lead.socials) as Record<string, string>
        } catch {
          return {}
        }
      })()
      const socials = { ...prevSocials, ...(result.socials ?? {}) }

      const updated = await db.lead.update({
        where: { id: leadId },
        data: {
          ...(email ? { email } : {}),
          ...(foundPhone ? { phone: foundPhone.intl, phoneE164: foundPhone.e164 } : {}),
          ...(foundWhatsapp && !lead.whatsapp ? { whatsapp: true } : {}),
          socials: JSON.stringify(socials),
          sources: JSON.stringify([...new Set([...safeParseStringArray(lead.sources), 'website-crawler'])]),
        },
      })

      if (email) {
        await db.search.updateMany({
          where: { id: searchId },
          data: { enriched: { increment: 1 } },
        })
        const runtime = orchState().runtimes.get(searchId)
        if (runtime) runtime.stats.enriched += 1
      }
      if (email || foundPhone) {
        publishSearch(searchId, { type: 'update', lead: toLeadDTO(updated) })
      }
      if (email && foundPhone) {
        publishSearch(searchId, { type: 'log', line: `crawl ▸ e-mail + WhatsApp achados no site`, tone: 'ok' })
      } else if (email) {
        publishSearch(searchId, { type: 'log', line: `crawl ▸ e-mail ${email} achado no site`, tone: 'ok' })
      } else if (foundPhone) {
        publishSearch(searchId, { type: 'log', line: `crawl ▸ telefone ${foundPhone.intl} achado no site`, tone: 'ok' })
      }
    },
    { key: `enrich:${leadId}`, attempts: 1 },
  )
}

/* ------------------------------------------------------------------ */
/* Falha total (nenhum provider etc.)                                   */
/* ------------------------------------------------------------------ */

async function failSearch(searchId: string, runtime: SearchRuntime, message: string): Promise<void> {
  runtime.status = 'failed'
  await db.search.update({
    where: { id: searchId },
    data: { status: 'failed', error: message, finishedAt: new Date() },
  }).catch(() => undefined)
  publishSearch(searchId, { type: 'log', line: `busca falhou: ${message}`, tone: 'error' })
  publishSearch(searchId, { type: 'error', message })
}

// keep import used (KANBAN_STAGES re-exportado pra UI de stages no servidor)
export { KANBAN_STAGES }
