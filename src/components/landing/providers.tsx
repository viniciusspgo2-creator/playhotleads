'use client'

// src/components/landing/providers.tsx
// Seção "Fontes": explica o Provider Registry (cada fonte = um plugin que
// implementa LeadProvider) e mostra o painel de toggles interativo.

import { useState } from 'react'
import {
  KeyRound,
  AlertTriangle,
  Lock,
  ToggleRight,
  Server,
  Globe,
  Code2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type ProviderKey =
  | 'overpass'
  | 'photon'
  | 'nominatim'
  | 'websearch'
  | 'google-places'
  | 'maps-scraper'
  | 'yelp'
  | 'yellowpages'
  | 'website-crawler'
  | 'serpapi'

type ProviderConfig = {
  key: ProviderKey
  label: string
  mode: 'api' | 'scrape'
  requiresApiKey?: boolean
  requiresProxy?: boolean
  note?: string
  defaultOn: boolean
}

const PROVIDER_LIST: ProviderConfig[] = [
  {
    key: 'overpass',
    label: 'OpenStreetMap (Overpass)',
    mode: 'scrape',
    defaultOn: true,
    note: 'base aberta global, sem key — cidade inteira por área',
  },
  {
    key: 'photon',
    label: 'Photon (POI)',
    mode: 'api',
    defaultOn: true,
    note: 'POIs do OSM, rápida e sem limite prático',
  },
  {
    key: 'nominatim',
    label: 'Nominatim',
    mode: 'api',
    defaultOn: true,
    note: 'geocoding + POI com telefone quando mapeado',
  },
  {
    key: 'websearch',
    label: 'Busca Web (orgânica)',
    mode: 'api',
    defaultOn: true,
    note: 'descobre sites, diretórios e contatos no índice de busca',
  },
  {
    key: 'google-places',
    label: 'Google Places',
    mode: 'api',
    requiresApiKey: true,
    defaultOn: false,
    note: 'dado premium — liga com sua API key',
  },
  {
    key: 'maps-scraper',
    label: 'Google Maps',
    mode: 'scrape',
    requiresProxy: true,
    defaultOn: false,
    note: 'sujeito a bloqueio',
  },
  {
    key: 'yelp',
    label: 'Yelp',
    mode: 'scrape',
    defaultOn: false,
  },
  {
    key: 'yellowpages',
    label: 'Yellow Pages',
    mode: 'scrape',
    defaultOn: false,
  },
  {
    key: 'website-crawler',
    label: 'Site da empresa (crawl)',
    mode: 'scrape',
    defaultOn: true,
    note: 'enriquece com WhatsApp, e-mail e redes sociais',
  },
  {
    key: 'serpapi',
    label: 'SerpAPI',
    mode: 'api',
    requiresApiKey: true,
    defaultOn: false,
    note: 'busca orgânica complementar',
  },
]

export function Providers() {
  const [enabled, setEnabled] = useState<Record<ProviderKey, boolean>>(
    Object.fromEntries(PROVIDER_LIST.map((p) => [p.key, p.defaultOn])) as Record<
      ProviderKey,
      boolean
    >,
  )

  const onCount = Object.values(enabled).filter(Boolean).length

  return (
    <section id="fontes" className="scroll-mt-20 bg-zinc-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Coluna esquerda: conceito + código */}
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
              Arquitetura aberta
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Provider Registry: cada fonte é um plugin
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-600">
              Toda fonte de dados implementa a mesma interface. O orquestrador não sabe —
              nem liga — se está falando com uma API paga ou com um scraper free com proxy.
              Você ativa e desativa no painel, sem tocar em código.
            </p>

            {/* Snippet da interface */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                <span className="flex items-center gap-2 font-mono text-[12px] text-zinc-500">
                  <Code2 className="size-3.5" aria-hidden="true" />
                  packages/providers/types.ts
                </span>
                <Badge
                  variant="outline"
                  className="rounded-full border-zinc-700 px-2 py-0.5 text-[10.5px] text-zinc-400"
                >
                  TypeScript
                </Badge>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed scrollbar-slim-dark">
                <code>
                  <span className="text-orange-400">export interface</span>{' '}
                  <span className="text-sky-300">LeadProvider</span> {'{'}
                  {'\n'}  <span className="text-zinc-300">id</span>
                  <span className="text-zinc-500">:</span>{' '}
                  <span className="text-sky-300">string</span>
                  {'\n'}  <span className="text-zinc-300">mode</span>
                  <span className="text-zinc-500">:</span>{' '}
                  <span className="text-emerald-400">&apos;api&apos;</span>
                  <span className="text-zinc-500"> | </span>
                  <span className="text-emerald-400">&apos;scrape&apos;</span>
                  {'\n'}  <span className="text-zinc-300">countries</span>
                  <span className="text-zinc-500">:</span>{' '}
                  <span className="text-sky-300">string[]</span>
                  <span className="text-zinc-500"> | </span>
                  <span className="text-emerald-400">&apos;global&apos;</span>
                  {'\n'}  <span className="text-zinc-300">requiresProxy</span>
                  <span className="text-zinc-500">?:</span>{' '}
                  <span className="text-sky-300">boolean</span>
                  {'\n'}  <span className="text-zinc-300">costPerRequest</span>
                  <span className="text-zinc-500">?:</span>{' '}
                  <span className="text-sky-300">number</span>
                  {'\n\n'}  <span className="text-zinc-300">search</span>
                  <span className="text-zinc-500">(</span>
                  <span className="text-zinc-300">params</span>
                  <span className="text-zinc-500">, </span>
                  <span className="text-zinc-300">ctx</span>
                  <span className="text-zinc-500">):</span>{' '}
                  <span className="text-sky-300">AsyncIterable</span>
                  <span className="text-zinc-500">&lt;</span>
                  <span className="text-sky-300">RawLead</span>
                  <span className="text-zinc-500">&gt;</span>
                  {'\n'}
                  {'}'}
                  {'\n\n'}
                  <span className="text-zinc-600">
                    {/* adicionar fonte nova = criar 1 arquivo. o resto não muda. */}
                    {'// adicionar fonte nova = criar 1 arquivo.\n// o resto do sistema nem muda.'}
                  </span>
                </code>
              </pre>
            </div>

            {/* Bullets de valor */}
            <ul className="mt-8 space-y-3.5">
              {[
                {
                  title: 'API paga + scraping free, juntos',
                  body: 'Google Places entrega o dado limpo; os scrapers free preenchem os buracos — sem pagar pelo que já existe.',
                },
                {
                  title: 'Fail-safe por fonte',
                  body: 'Um provider bloqueado é isolado com retry e backoff. A busca inteira nunca cai por causa de um.',
                },
                {
                  title: 'Busca global',
                  body: 'Cada país ativa as fontes e o idioma certos. BR hoje, US amanhã, sem reconfigurar nada.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-orange-100 text-primary">
                    <ToggleRight className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-zinc-900">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna direita: painel de settings interativo */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-950/5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-bold text-zinc-900">Fontes de busca</h3>
                <Badge
                  variant="outline"
                  className="rounded-full border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-orange-700"
                >
                  {onCount} ativas
                </Badge>
              </div>

              <ul className="mt-4 divide-y divide-zinc-100">
                {PROVIDER_LIST.map((p) => (
                  <li key={p.key} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-zinc-800">
                          {p.label}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                            p.mode === 'api'
                              ? 'bg-sky-50 text-sky-600'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {p.mode}
                        </span>
                        {p.requiresApiKey && (
                          <span
                            className="flex items-center gap-0.5 text-[11px] font-medium text-amber-600"
                            title="Requer chave de API"
                          >
                            <KeyRound className="size-3" aria-hidden="true" />
                            chave
                          </span>
                        )}
                        {p.requiresProxy && (
                          <span
                            className="flex items-center gap-0.5 text-[11px] font-medium text-amber-600"
                            title="Recomendado usar proxy residencial"
                          >
                            <AlertTriangle className="size-3" aria-hidden="true" />
                            usa proxy
                          </span>
                        )}
                      </div>
                      {p.note && (
                        <p className="mt-0.5 truncate text-[12px] text-zinc-500">{p.note}</p>
                      )}
                    </div>
                    <Switch
                      checked={enabled[p.key]}
                      onCheckedChange={(checked: boolean) =>
                        setEnabled((prev) => ({ ...prev, [p.key]: checked }))
                      }
                      aria-label={`Ativar ${p.label}`}
                    />
                  </li>
                ))}
              </ul>

              {/* Proxy */}
              <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-zinc-800">
                    <Server className="size-4 text-zinc-500" aria-hidden="true" />
                    Proxy residencial
                  </span>
                  <span className="text-[11.5px] font-medium text-zinc-500">por tenant</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Input
                    disabled
                    value="BrightData / Smartproxy"
                    aria-label="Provedor de proxy"
                    className="h-9 rounded-lg bg-white text-[13px] text-zinc-400"
                  />
                  <Input
                    disabled
                    type="password"
                    value="••••••••••••"
                    aria-label="Credenciais do proxy (criptografadas)"
                    className="h-9 rounded-lg bg-white text-[13px]"
                  />
                </div>
              </div>

              {/* API keys */}
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-zinc-800">
                    <KeyRound className="size-4 text-zinc-500" aria-hidden="true" />
                    Chaves de API
                  </span>
                  <span className="flex items-center gap-1 text-[11.5px] font-medium text-emerald-600">
                    <Lock className="size-3" aria-hidden="true" />
                    AES-256 em repouso
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Input
                    disabled
                    type="password"
                    value="AIza•••••••••••••"
                    aria-label="Chave Google Places (criptografada)"
                    className="h-9 rounded-lg bg-white text-[13px]"
                  />
                  <Input
                    disabled
                    type="password"
                    value="••••••••••••••••"
                    aria-label="Chave SerpAPI (criptografada)"
                    className="h-9 rounded-lg bg-white text-[13px]"
                  />
                </div>
              </div>

              <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-zinc-500">
                <Globe className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Cada cliente do SaaS usa as próprias chaves e o próprio proxy — ou o modelo
                gerenciado, se você preferir cobrar por inclusão. Configuração isolada por
                tenant, criptografada no banco.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
