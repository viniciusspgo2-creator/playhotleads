// src/core/countries.ts
// Metadados por país: locale, região telefônica (E.164), TLD e pools de
// dados para os providers em modo demo (nomes, cidades e ruas locais —
// a busca é GLOBAL: trocou país, trocou idioma e formato dos dados).

import type { CountryCode } from './types'

export interface CountryMeta {
  code: CountryCode
  name: string
  flag: string
  locale: string
  /** região libphonenumber para normalizar telefones */
  phoneRegion: CountryCode
  tld: string
  currency: string
  cities: string[]
  streets: string[]
  /** sufixos de razão social comuns no país */
  legal: string[]
}

const FIRST_NAMES_PT = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Juliana', 'Rafael',
  'Marina', 'Tiago', 'Camila', 'Lucas', 'Patrícia', 'André', 'Renata', 'Gustavo',
]
const FIRST_NAMES_ES = [
  'Lucía', 'Martín', 'Sofía', 'Javier', 'Valentina', 'Mateo', 'Camila', 'Diego',
  'Isabella', 'Alejandro', 'Valeria', 'Nicolás', 'Emma', 'Santiago',
]
const FIRST_NAMES_EN = [
  'Oliver', 'Amelia', 'Harry', 'Sophia', 'Jack', 'Emily', 'George', 'Isla',
  'Noah', 'Ava', 'Charlie', 'Lily', 'Mason', 'Grace',
]
const FIRST_NAMES_DE = [
  'Lukas', 'Anna', 'Felix', 'Lena', 'Jonas', 'Marie', 'Maximilian', 'Sophie',
  'Paul', 'Emma', 'Leon', 'Hannah',
]

const NAME_POOLS: Record<string, string[]> = {
  pt: FIRST_NAMES_PT,
  es: FIRST_NAMES_ES,
  en: FIRST_NAMES_EN,
  de: FIRST_NAMES_DE,
}

export function namePool(locale: string): string[] {
  const lang = locale.split('-')[0] ?? 'en'
  return NAME_POOLS[lang] ?? NAME_POOLS.en!
}

export const COUNTRIES: Record<CountryCode, CountryMeta> = {
  BR: {
    code: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    locale: 'pt-BR',
    phoneRegion: 'BR',
    tld: 'com.br',
    currency: 'BRL',
    cities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza'],
    streets: ['Rua das Acácias', 'Av. Paulista', 'Rua Aurora', 'Av. Brasil', 'Rua XV de Novembro', 'Av. Atlântica'],
    legal: ['LTDA', 'ME', 'Eireli'],
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    locale: 'en-US',
    phoneRegion: 'US',
    tld: 'com',
    currency: 'USD',
    cities: ['New York', 'Austin', 'Miami', 'Chicago', 'Denver', 'Seattle', 'Boston', 'San Diego'],
    streets: ['Main St', 'Broadway', 'Oak Avenue', 'Sunset Blvd', 'Market Street', 'Lexington Ave'],
    legal: ['LLC', 'Inc.'],
  },
  PT: {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    locale: 'pt-PT',
    phoneRegion: 'PT',
    tld: 'pt',
    currency: 'EUR',
    cities: ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Aveiro'],
    streets: ['Rua Augusta', 'Av. da Liberdade', 'Rua de Santa Catarina', 'Praça do Comércio'],
    legal: ['Lda.', 'Unipessoal'],
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    locale: 'es-AR',
    phoneRegion: 'AR',
    tld: 'com.ar',
    currency: 'ARS',
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata'],
    streets: ['Av. Corrientes', 'Calle Florida', 'Av. Santa Fe', 'Av. Rivadavia'],
    legal: ['S.A.', 'SRL'],
  },
  MX: {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    locale: 'es-MX',
    phoneRegion: 'MX',
    tld: 'com.mx',
    currency: 'MXN',
    cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Mérida'],
    streets: ['Av. Reforma', 'Av. Insurgentes', 'Calle Madero', 'Av. Juárez'],
    legal: ['S.A. de C.V.', 'S. de R.L.'],
  },
  ES: {
    code: 'ES',
    name: 'España',
    flag: '🇪🇸',
    locale: 'es-ES',
    phoneRegion: 'ES',
    tld: 'es',
    currency: 'EUR',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga'],
    streets: ['Calle de Alcalá', 'Gran Vía', 'Passeig de Gràcia', 'Calle Serrano'],
    legal: ['S.L.', 'S.A.'],
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    locale: 'en-GB',
    phoneRegion: 'GB',
    tld: 'co.uk',
    currency: 'GBP',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh'],
    streets: ['High Street', 'Oxford Street', 'King’s Road', 'Baker Street'],
    legal: ['Ltd', 'PLC'],
  },
  DE: {
    code: 'DE',
    name: 'Deutschland',
    flag: '🇩🇪',
    locale: 'de-DE',
    phoneRegion: 'DE',
    tld: 'de',
    currency: 'EUR',
    cities: ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart'],
    streets: ['Hauptstraße', 'Kurfürstendamm', 'Bahnhofstraße', 'Berliner Allee'],
    legal: ['GmbH', 'GbR'],
  },
}

export const COUNTRY_LIST: CountryMeta[] = Object.values(COUNTRIES)

export function isCountryCode(value: string): value is CountryCode {
  return Object.prototype.hasOwnProperty.call(COUNTRIES, value)
}
