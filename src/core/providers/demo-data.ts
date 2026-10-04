// src/core/providers/demo-data.ts
// Pool de "empresas" fictícias localizadas por país. Todos os providers em
// modo demo sorteiam FATIAS do mesmo pool (com sobreposição proposital) —
// é isso que faz a deduplicação multi-fonte acontecer de verdade.
// Determinístico por (nicho, localização, país, seed): a mesma busca
// reconectada mostra os mesmos leads; buscas novas variam.

import { COUNTRIES, namePool } from '../countries'
import { slugifyDomain } from '../normalize'
import type { CountryCode, SearchParams } from '../types'

export interface DemoBiz {
  name: string
  address: string
  rating: number | null
  website: string | null
  email: string | null
  phone: string
  mobile: boolean
  mapsUrl: string
  socials?: { instagram?: string; facebook?: string }
}

/** FNV-1a → uint32 */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** PRNG determinístico */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BRANDS: Record<string, string[]> = {
  pt: ['Prime', 'Ápice', 'Vitalis', 'Solar', 'Bela Vista', 'Real', 'Nobre', 'Lumen', 'Forma', 'Center', 'Novo Tempo', 'Atlântica'],
  es: ['Prime', 'Centro', 'Aurora', 'Del Sol', 'Real', 'Norte', 'Vital', 'Las Américas', 'Mediterránea', 'Excelencia'],
  en: ['Prime', 'Peak', 'Summit', 'Core', 'Bright', 'Elite', 'Central', 'Harbor', 'Northside', 'Union', 'Crown'],
  de: ['Prime', 'Zentrum', 'Nordlicht', 'Bergblick', 'Elit', 'Kern', 'Rhein', 'Sonnenseite'],
}

const CONTACT_PREFIX: Record<string, string> = {
  'pt-BR': 'contato',
  'pt-PT': 'geral',
  'es-AR': 'contacto',
  'es-MX': 'contacto',
  'es-ES': 'info',
  'en-US': 'info',
  'en-GB': 'hello',
  'de-DE': 'info',
}

function digits(rng: () => number, count: number): string {
  let out = ''
  for (let i = 0; i < count; i++) out += Math.floor(rng() * 10).toString()
  return out
}

/** Número local plausível e parseável por libphonenumber por região. */
function genPhone(region: CountryCode, rng: () => number, mobile: boolean): string {
  switch (region) {
    case 'BR': {
      const ddd = ['11', '21', '31', '41', '51', '61', '71', '81', '85'][Math.floor(rng() * 9)] ?? '11'
      return mobile ? `(${ddd}) 9${digits(rng, 4)}-${digits(rng, 4)}` : `(${ddd}) 3${digits(rng, 3)}-${digits(rng, 4)}`
    }
    case 'US': {
      const area = ['212', '415', '305', '312', '206', '617', '619', '303'][Math.floor(rng() * 8)] ?? '212'
      const exch = ['201', '322', '456', '646', '781', '903'][Math.floor(rng() * 6)] ?? '322'
      return `(${area}) ${exch}-${digits(rng, 4)}`
    }
    case 'PT':
      return mobile ? `9${Math.floor(rng() * 3) + 1} ${digits(rng, 3)} ${digits(rng, 3)}` : `21 ${digits(rng, 3)} ${digits(rng, 4)}`
    case 'AR':
      return mobile ? `9 11 ${digits(rng, 4)}-${digits(rng, 4)}` : `11 ${digits(rng, 4)}-${digits(rng, 4)}`
    case 'MX': {
      const area = ['55', '33', '81', '222'][Math.floor(rng() * 4)] ?? '55'
      return `${area} ${digits(rng, 4)} ${digits(rng, 4)}`
    }
    case 'ES':
      return mobile ? `6${digits(rng, 2)} ${digits(rng, 3)} ${digits(rng, 3)}` : `91 ${digits(rng, 3)} ${digits(rng, 3)}`
    case 'GB':
      // faixas reservadas pra ficção (Ofcom): 07700 900xxx / 020 7946 0xxx
      return mobile ? `07700 900${digits(rng, 3)}` : `020 7946 0${digits(rng, 3)}`
    case 'DE':
      return mobile ? `151${Math.floor(rng() * 2)} ${digits(rng, 3)}${digits(rng, 4)}` : `30 ${digits(rng, 4)}${digits(rng, 4)}`
  }
}

function titleCase(s: string): string {
  return s.replace(/\p{L}[\p{L}'’]*/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1))
}

/**
 * Pool base de `count` negócios pro nicho/local/país. O seed (searchId)
 * garante: mesma busca → mesmos negócios; buscas novas → novos conjuntos.
 */
export function buildDemoPool(params: SearchParams, seed: string, count = 20): DemoBiz[] {
  const meta = COUNTRIES[params.country]
  const rng = mulberry32(hashSeed(`${params.niche}|${params.location}|${params.country}|${seed}`))
  const first = namePool(meta.locale)
  const brands = BRANDS[meta.locale.split('-')[0] ?? 'en'] ?? BRANDS.en!
  const contactPrefix = CONTACT_PREFIX[meta.locale] ?? 'info'

  const nicheWords = params.niche.trim().split(/\s+/).slice(0, 2)
  const nicheHead = titleCase(nicheWords[0] ?? params.niche)
  const nicheCap = titleCase(params.niche)

  const pool: DemoBiz[] = []

  for (let i = 0; i < count; i++) {
    const brand = brands[Math.floor(rng() * brands.length)] ?? 'Prime'
    const person = `${first[Math.floor(rng() * first.length)] ?? 'Ana'} ${first[Math.floor(rng() * first.length)] ?? 'Silva'}`
    const pattern = rng()

    let name: string
    if (pattern < 0.3) name = `${nicheHead} ${brand}`
    else if (pattern < 0.55) name = `${brand} ${nicheHead}`
    else if (pattern < 0.8) name = `${person} ${nicheHead}`
    else name = `${nicheCap} ${brand}`

    const street = meta.streets[Math.floor(rng() * meta.streets.length)] ?? 'Rua Principal'
    const address = `${street}, ${Math.floor(rng() * 1800) + 12} — ${params.location}`
    const rating = rng() < 0.85 ? Math.round((3.5 + rng() * 1.5) * 10) / 10 : null

    const mobile = rng() < 0.62
    const phone = genPhone(params.country, rng, mobile)

    const hasSite = rng() < 0.78
    const website = hasSite
      ? `https://www.${slugifyDomain(name)}.${meta.tld}`
      : null

    const email = hasSite && rng() < 0.42
      ? `${contactPrefix}@${slugifyDomain(name)}.${meta.tld}`
      : null

    const socials = rng() < 0.5
      ? { instagram: `https://instagram.com/${slugifyDomain(name)}` }
      : rng() < 0.3
        ? { facebook: `https://facebook.com/${slugifyDomain(name)}` }
        : undefined

    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${params.location}`)}`

    pool.push({ name, address, rating, website, email, phone, mobile, mapsUrl, socials })
  }

  return pool
}
