// src/core/providers/websearch.ts
// Descoberta web REAL via Brave Search API (env BRAVE_SEARCH_API_KEY). Estratégia em 3 camadas:
//
//   1. queries "{sinônimo} {cidade} telefone/contato" → snippets trazem
//      telefone/WhatsApp/e-mail/Instagram direto do índice
//   2. queries site:diretório (Apontador, GuiaMais, Hotfrog, Solutudo) →
//      páginas de listagem são baixadas e parseadas (telefones reais)
//   3. sites de empresa achados no orgânico viram leads com website →
//      o website-crawler enriquece com e-mail/WhatsApp depois
//
// Referência de técnica: ContactInfoScraper (GitHub) e scrapers de diretórios.

import { ProviderError, type LeadProvider, type RawLead, type SearchParams } from '../types'
import type { ProviderContext } from '../types'
import { fetchText } from './http'
import { sharedExpansion } from '../expansion'
import { sleep } from '../normalize'

interface SearchItem {
  url?: string
  name?: string
  snippet?: string
  host_name?: string
  rank?: number
}

/* ------------------------------------------------------------------ */
/* Extração                                                             */
/* ------------------------------------------------------------------ */

const WA_RE = /(?:wa\.me\/|api\.whatsapp\.com\/send\?(?:[^>\s"']*&)*?phone=)(\d{10,16})/i
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const IG_RE = /instagram\.com\/([A-Za-z0-9_.]{2,40})/i
const PHONE_CANDIDATE_RE =
  /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,3}\)|\d{2,3})[\s.-]?\d{3,5}[\s.-]?\d{3,4}/g

const IG_RESERVED = /^(p|reel|explore|stories|tv|accounts?)$/i

const BLOCKED_HOSTS = [
  'google.', 'gstatic.', 'youtube.', 'facebook.', 'instagram.', 'linkedin.',
  'tiktok.', 'twitter.', 'x.com', 'whatsapp.', 'wa.me', 'bing.', 'duckduckgo.',
  'yahoo.', 'wikipedia.', 'mercadolivre.', 'mercadolibre.', 'shopee.', 'amazon.',
  'indeed.', 'reclameaqui.', 'tripadvisor.', 'yelp.', 'olx.', 'pinterest.',
  'playhotleads.',
  // agregadores de conteúdo/imagens/plantas — nada de lead de negócio aqui
  'etsy.', 'flickr.', 'dreamstime.', 'airbnb.', 'booking.', 'shutterstock.',
  'istockphoto.', 'alamy.', '123rf.', 'freepik.', 'wikimedia.', 'wiktionary.',
  'gov.', '.gob.', '.edu.', 'conabio.', 'dreamstime', 'depositphotos.',
  'adobe.com', 'gettyimages.', 'difusordeimagens.', 'realtor.', 'zapimoveis.',
  'vivareal.', 'mlstatic.', 'reddit.', 'quora.', 'tiktok.',
]

const DIRECTORY_HOSTS = [
  'apontador.com.br', 'guiamais.com.br', 'hotfrog.com.br', 'solutudo.com.br',
  'guiafacil.com', 'guianapolis.com.br', 'telelistas.net', 'encontracnpj.com',
  'paginaamarela.com.br', 'enkontre.com.br', 'econodata.com.br',
  'ondecomprarbarato.com', 'guiamais.com', 'apontador.com',
]

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase()
  return BLOCKED_HOSTS.some((b) => h.includes(b))
}

function isDirectoryHost(host: string): boolean {
  const h = host.toLowerCase()
  return DIRECTORY_HOSTS.some((d) => h.includes(d))
}

function extractPhones(text: string, max = 3): string[] {
  const found = text.match(PHONE_CANDIDATE_RE) ?? []
  const unique = new Set<string>()
  for (const raw of found) {
    const digits = raw.replace(/\D/g, '')
    // 10-13 dígitos: telefone válido; 8/9 dígitos soltos são lixo demais
    if (digits.length < 10 || digits.length > 13) continue
    // rejeita repetidos (1111111111) e sequências óbvias
    if (/^(\d)\1+$/.test(digits)) continue
    unique.add(raw.trim())
    if (unique.size >= max) break
  }
  return [...unique]
}

function extractEmail(text: string): string | undefined {
  const found = text.match(EMAIL_RE) ?? []
  for (const raw of found) {
    const email = raw.toLowerCase()
    if (/(example\.|sentry\.|\.png|\.jpg|\.webp)/.test(email)) continue
    return email
  }
  return undefined
}

function extractInstagram(text: string): string | undefined {
  const match = IG_RE.exec(text)
  if (!match?.[1]) return undefined
  if (IG_RESERVED.test(match[1])) return undefined
  return `https://instagram.com/${match[1]}`
}

const TITLE_BRANDS =
  /[-|–—»]?\s*(apontador|guiamais|hotfrog|solutudo|guiafacil|telelistas|telefone|endere[cç]o|whatsapp|instagram|facebook|youtube|google|osmelhores|guia d[oa] cidade|encontre)\s*[^|]*$/i

function cleanTitle(raw: string, host: string): string {
  let title = raw.replace(/\s+/g, ' ').trim()
  // remove sufixo " | Marca do site" repetido
  const parts = title.split(/\s[|–—»]\s/)
  if (parts.length > 1) {
    const tail = parts[parts.length - 1] ?? ''
    if (tail.length <= 40 && (tail.toLowerCase().includes(host.split('.')[0] ?? '') || TITLE_BRANDS.test(tail))) {
      title = parts.slice(0, -1).join(' - ')
    }
  }
  return title.slice(0, 90).trim()
}

function mapsUrlFor(name: string, location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${location}`)}`
}

/**
 * Guarda de relevância: resultado orgânico só vira lead se estiver ancorado
 * na localização (nome/snippet cita a cidade/UF) OU trouxe algum contato.
 * Mata o ruído tipo "Fumaria parviflora — ficha da planta" do sinônimo "fumo".
 */
function isRelevant(text: string, location: string, hasContact: boolean): boolean {
  if (hasContact) return true
  const hay = text.toLowerCase()
  const tokens = location
    .split(/[,-]/)
    .map((t) =>
      t.trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase(),
    )
    .filter((t) => t.length >= 2)
  return tokens.some((tok) => hay.includes(tok))
}

/* ------------------------------------------------------------------ */
/* Busca web (Brave Search API)                                         */
/* ------------------------------------------------------------------ */
// O SDK do Z.AI só roda dentro do ambiente do Z.AI. Aqui usamos a Brave
// Search API (plano gratuito) — env BRAVE_SEARCH_API_KEY. Sem a chave o
// provider falha de forma isolada (a busca continua com as outras fontes).

interface BraveWebResult {
  url?: string
  title?: string
  description?: string
  meta_url?: { hostname?: string }
}

async function runSearch(query: string, num: number): Promise<SearchItem[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) {
    throw new ProviderError('websearch', 'BRAVE_SEARCH_API_KEY não configurada — fonte web indisponível')
  }
  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', String(Math.min(Math.max(num, 1), 20)))
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'x-subscription-token': apiKey },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new ProviderError('websearch', `Brave Search HTTP ${res.status}`)
  const data = (await res.json()) as { web?: { results?: BraveWebResult[] } }
  return (data.web?.results ?? []).map((r, i) => ({
    url: r.url,
    name: r.title,
    snippet: r.description,
    host_name: r.meta_url?.hostname,
    rank: i + 1,
  }))
}

/* ------------------------------------------------------------------ */
/* Diretórios                                                           */
/* ------------------------------------------------------------------ */

interface DirectoryHit {
  name: string
  phone?: string
}

async function scrapeDirectoryPage(
  url: string,
  signal: AbortSignal,
): Promise<DirectoryHit | null> {
  try {
    const { body } = await fetchText('websearch', url, {
      signal,
      timeoutMs: 9_000,
      maxBytes: 250_000,
    })
    const title =
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{3,120})["']/i.exec(body)?.[1] ??
      /<title[^>]*>([^<]{3,120})<\/title>/i.exec(body)?.[1]
    if (!title) return null

    const phones = extractPhones(body, 1)
    const name = cleanTitle(title, new URL(url).hostname)
    if (name.length < 4) return null
    return { name, phone: phones[0] }
  } catch {
    return null
  }
}

/** Concorrência limitada — cadência humana mesmo em paralelo. */
async function mapLimited<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await fn(items[index]!)
    }
  })
  await Promise.all(workers)
  return results
}

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

async function* searchLive(params: SearchParams, ctx: ProviderContext): AsyncIterable<RawLead> {
  const expansion = await sharedExpansion(params.niche, params.location, params.country, ctx.signal)
  const location = params.location
  const niche = params.niche

  // camada 1+2: queries orgânicas + diretórios (cidade principal + vizinhas)
  const statePart = params.location.split(',').slice(1).join(',').trim()
  const neighborLabels = expansion.cities.slice(0, 2).map((c) => (statePart ? `${c}, ${statePart}` : c))

  const queries: Array<{ q: string; num: number }> = [
    { q: `${niche} ${location} telefone whatsapp`, num: 10 },
    { q: `${niche} ${location} contato`, num: 8 },
    { q: `lista de ${niche} em ${location}`, num: 10 },
    { q: `melhores ${niche} ${location} telefone`, num: 8 },
  ]
  for (const syn of expansion.synonyms.slice(1, 4)) {
    queries.push({ q: `${syn} ${location}`, num: 8 })
  }
  for (const neighbor of neighborLabels.slice(0, 2)) {
    queries.push({ q: `${niche} ${neighbor}`, num: 8 })
  }
  queries.push({ q: `site:apontador.com.br ${niche} ${location}`, num: 10 })
  queries.push({ q: `site:guiamais.com.br ${niche} ${location}`, num: 10 })
  queries.push({ q: `site:hotfrog.com.br ${niche} ${location}`, num: 8 })

  const directoryUrls = new Set<string>()
  const seenUrls = new Set<string>()
  let okQueries = 0
  let lastError: unknown = null

  for (const { q, num } of queries) {
    if (ctx.signal.aborted) return
    await ctx.rateLimiter.take()

    let items: SearchItem[]
    try {
      items = await runSearch(q, num)
    } catch (err) {
      lastError = err
      continue
    }
    okQueries += 1

    for (const item of items) {
      if (ctx.signal.aborted) return
      const url = item.url
      const host = (item.host_name ?? '').toLowerCase()
      if (!url || !host || seenUrls.has(url)) continue
      seenUrls.add(url)

      const text = `${item.name ?? ''}\n${item.snippet ?? ''}`
      const waMatch = WA_RE.exec(`${url}\n${text}`)
      const phones = extractPhones(text)
      const email = extractEmail(text)
      const ig = extractInstagram(`${url}\n${text}`)
      const waPhone = waMatch?.[1]

      if (isDirectoryHost(host)) {
        if (directoryUrls.size < 10) directoryUrls.add(url)
        continue
      }
      if (isBlockedHost(host)) continue

      const title = cleanTitle(item.name ?? '', host)
      if (title.length < 3) continue

      const hasContact = Boolean(waPhone ?? phones[0] ?? email ?? ig)
      if (!isRelevant(`${title}\n${item.snippet ?? ''}`, location, hasContact)) continue

      const lead: RawLead = {
        source: 'websearch',
        name: title,
        phone: waPhone ?? phones[0],
        mobile: Boolean(waPhone),
        email,
        website: url,
        mapsUrl: mapsUrlFor(title, location),
        socials: ig ? { instagram: ig } : undefined,
      }
      yield lead
      await sleep(30, ctx.signal).catch(() => undefined)
    }
  }

  // camada 2: páginas de diretório baixadas e parseadas
  if (directoryUrls.size > 0 && !ctx.signal.aborted) {
    const hits = await mapLimited([...directoryUrls].slice(0, 8), 3, (url) =>
      scrapeDirectoryPage(url, ctx.signal),
    )
    for (const hit of hits) {
      if (!hit || ctx.signal.aborted) continue
      const lead: RawLead = {
        source: 'websearch',
        name: hit.name,
        phone: hit.phone,
        mapsUrl: mapsUrlFor(hit.name, location),
      }
      yield lead
    }
  }

  if (okQueries === 0) {
    const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'sem resultados')
    throw new ProviderError('websearch', `motor de busca indisponível: ${message}`)
  }
}

export const websearchProvider: LeadProvider = {
  id: 'websearch',
  label: 'Busca Web (orgânica)',
  mode: 'api',
  runModes: ['live'],
  requiresProxy: false,
  requiresApiKey: false,
  countries: 'global',
  costPerRequest: 0,
  note: 'descobre sites, diretórios e contatos no índice de busca — sem key',
  search: searchLive,
}
