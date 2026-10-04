// src/core/providers/website-crawler.ts
// Enriquecimento (mode 'enrich'): visita o site real da empresa e caça o
// e-mail que ninguém publica (homepage + /contato|/contact), com cap de
// tamanho, timeout e extração de redes sociais. Em live faz fetch REAL —
// funciona no sandbox pra qualquer site público.
// Demo: deriva e-mail do domínio (contato@dominio) + social.

import type { EnrichmentResult, LeadProvider, RawLead, ProviderContext } from '../types'
import { fetchText } from './http'
import { domainFromUrl, isValidEmail, sleep } from '../normalize'

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const SOCIAL_RE = {
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+/,
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9_.-]+/,
  linkedin: /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_-]+/,
} as const

// contatos telefônicos — WhatsApp primeiro (melhor canal de conversão)
const WA_LINK_RE = /(?:wa\.me\/(?:pt\/)?|api\.whatsapp\.com\/send\?(?:[^"'\s<>]*&)*?phone=)(\d{10,16})/i
const TEL_RE = /tel:([+0-9().\s-]{7,25})/g
const TEXT_PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,3}\)|\d{2,3})[\s.-]?\d{3,5}[\s.-]?\d{3,4}/g

const JUNK_EMAIL = /(noreply|no-reply|donotreply|example\.|sentry\.io|wixpress|\.png|\.jpg|\.jpeg|\.webp|\.gif|godaddy|squarespace)/i

function extractEmails(html: string): string[] {
  const found = html.match(EMAIL_RE) ?? []
  const unique = new Set<string>()
  for (const raw of found) {
    const email = raw.toLowerCase().replace(/\.$/, '')
    if (JUNK_EMAIL.test(email)) continue
    if (isValidEmail(email)) unique.add(email)
  }
  return [...unique]
}

/** Candidatas: homepage + páginas de contato comuns (no idioma do país). */
function candidatePages(website: string, locale: string): string[] {
  const base = website.replace(/\/$/, '')
  const lang = locale.split('-')[0] ?? 'pt'
  const contactPaths =
    lang === 'es' ? ['/contacto', '/contactenos']
    : lang === 'en' ? ['/contact', '/contact-us']
    : lang === 'de' ? ['/kontakt']
    : ['/contato', '/fale-conosco']
  return [base, ...contactPaths.map((p) => `${base}${p}`)]
}

async function enrichLive(lead: RawLead, ctx: ProviderContext): Promise<EnrichmentResult> {
  if (!lead.website) return {}

  const pages = candidatePages(lead.website, ctx.locale)
  const result: EnrichmentResult = {}
  let emailPool: string[] = []

  // Tenta no máximo 3 páginas (homepage + 2 contatos) — cadência humana
  for (const url of pages.slice(0, 3)) {
    if (ctx.signal.aborted) break
    try {
      await ctx.rateLimiter.take()
      const { body } = await fetchText('website-crawler', url, {
        signal: ctx.signal,
        timeoutMs: 9_000,
        maxBytes: 300_000,
      })
      emailPool = emailPool.concat(extractEmails(body))

      // WhatsApp (wa.me / api.whatsapp.com) — o contato mais valioso do BR
      if (!result.phone) {
        const wa = WA_LINK_RE.exec(body)?.[1]
        if (wa) {
          result.phone = wa
          result.whatsapp = true
        }
      }

      // tel: links costumam vir já em E.164
      if (!result.phone) {
        const tel = [...body.matchAll(TEL_RE)].map((m) => m[1]?.trim()).find(Boolean)
        if (tel) result.phone = tel
      }

      // último recurso: telefone cru no texto (orquestrador valida E.164)
      if (!result.phone) {
        const rawPhone = [...body.matchAll(TEXT_PHONE_RE)]
          .map((m) => m[0]?.trim())
          .find((p) => p && p.replace(/\D/g, '').length >= 10 && p.replace(/\D/g, '').length <= 13)
        if (rawPhone) result.phone = rawPhone
      }

      if (!result.socials) {
        const socials: EnrichmentResult['socials'] = {}
        const ig = SOCIAL_RE.instagram.exec(body)?.[0]
        const fb = SOCIAL_RE.facebook.exec(body)?.[0]
        const li = SOCIAL_RE.linkedin.exec(body)?.[0]
        if (ig) socials.instagram = ig
        if (fb) socials.facebook = fb
        if (li) socials.linkedin = li
        if (ig || fb || li) result.socials = socials
      }
      if (emailPool.length > 0 && result.phone && result.socials) break
    } catch {
      // página inacessível — tenta a próxima
    }
    await sleep(250, ctx.signal).catch(() => undefined)
  }

  if (emailPool.length > 0) {
    // Prioridade: e-mail do próprio domínio > genérico
    const domain = domainFromUrl(lead.website)
    const own = domain ? emailPool.find((e) => e.endsWith(`@${domain}`)) : undefined
    result.email = own ?? emailPool[0]
  }
  return result
}

async function enrichDemo(lead: RawLead, _ctx: ProviderContext): Promise<EnrichmentResult> {
  const domain = domainFromUrl(lead.website)
  if (!domain) return {}
  const result: EnrichmentResult = {
    email: `contato@${domain}`,
    socials: { instagram: `https://instagram.com/${domain.split('.')[0]}` },
  }
  await sleep(600 + Math.floor(Math.random() * 700))
  return result
}

export const websiteCrawlerProvider: LeadProvider = {
  id: 'website-crawler',
  label: 'Site da empresa (crawl)',
  mode: 'enrich',
  runModes: ['demo', 'live'],
  requiresProxy: false,
  requiresApiKey: false,
  countries: 'global',
  note: 'enriquece leads com WhatsApp, e-mail e redes sociais do site',
  // enrich-only: search nunca é chamado pelo orquestrador
  async *search() {
    return
  },
  async enrich(lead, ctx) {
    return ctx.runMode === 'live' ? enrichLive(lead, ctx) : enrichDemo(lead, ctx)
  },
}
