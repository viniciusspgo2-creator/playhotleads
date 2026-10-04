// src/core/normalize.ts
// Normalização — regras nº 5 e 6: telefone E.164 com libphonenumber,
// e-mail validado por regex, nome normalizado e dedup_key determinística.

import { createHash } from 'node:crypto'
import { parsePhoneNumberFromString, type CountryCode as PhoneRegion } from 'libphonenumber-js'
import type { CountryCode } from './types'

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email: string | undefined | null): email is string {
  if (!email || email.length > 254) return false
  return EMAIL_RE.test(email)
}

/** lowercase, sem pontuação, espaços colapsados — insumo do dedup. */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ParsedPhone {
  e164: string
  /** formato internacional legível: +55 11 3045-2210 */
  intl: string
  isMobile: boolean
}

/** Aceita formatos locais ou internacionais; valida de verdade. */
export function parsePhone(raw: string, country: CountryCode): ParsedPhone | null {
  const cleaned = raw.replace(/[^\d+()-\s]/g, '').trim()
  if (cleaned.replace(/\D/g, '').length < 7) return null
  try {
    const parsed = parsePhoneNumberFromString(cleaned, country as PhoneRegion)
    if (!parsed || !parsed.isValid()) return null
    const type = parsed.getType()
    return {
      e164: parsed.number,
      intl: parsed.formatInternational(),
      isMobile: type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE',
    }
  } catch {
    return null
  }
}

export function domainFromUrl(url: string | undefined | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

/**
 * dedup_key = sha1(phoneE164 | domain | normalizedName).
 * Componentes ausentes são omitidos — o hash é estável por lead.
 */
export function buildDedupKey(input: {
  phoneE164?: string | null
  domain?: string | null
  normalizedName?: string | null
}): string {
  const parts = [input.phoneE164 ?? '', input.domain ?? '', input.normalizedName ?? '']
  return createHash('sha1').update(parts.join('|')).digest('hex')
}

export function slugifyDomain(name: string): string {
  return normalizeName(name).replace(/\s+/g, '')
}

/** delay com jitter — cadência humana (regra nº 4). */
export function humanDelay(baseMs: number, jitterMs: number): number {
  return Math.max(80, Math.round(baseMs + (Math.random() * 2 - 1) * jitterMs))
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
