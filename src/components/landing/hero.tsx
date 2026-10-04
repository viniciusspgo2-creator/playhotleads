'use client'

// src/components/landing/hero.tsx
// Hero da landing: promessa central + mockup da busca (nicho/local/país).
// O botão "Procurar" dispara o evento 'phl:run-search' que o LiveDemo escuta
// e rola a página até a demonstração — prova visual imediata do produto.

import { useCallback, useState } from 'react'
import {
  Flame,
  MapPin,
  Search,
  Sparkles,
  Globe,
  Zap,
  Layers,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const COUNTRIES = [
  { value: 'BR', label: '🇧🇷 Brasil' },
  { value: 'US', label: '🇺🇸 Estados Unidos' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'AR', label: '🇦🇷 Argentina' },
  { value: 'MX', label: '🇲🇽 México' },
  { value: 'ES', label: '🇪🇸 Espanha' },
  { value: 'GB', label: '🇬🇧 Reino Unido' },
  { value: 'DE', label: '🇩🇪 Alemanha' },
] as const

const PROVIDER_NAMES = [
  'Google Places',
  'Google Maps',
  'Yelp',
  'Yellow Pages',
  'SerpAPI',
  'Crawl do site',
] as const

const HIGHLIGHTS = [
  { icon: Layers, label: '6 fontes em paralelo' },
  { icon: Zap, label: 'Cards em tempo real' },
  { icon: Globe, label: 'Busca global' },
  { icon: ShieldCheck, label: 'Dedup automático' },
] as const

export function Hero() {
  const [niche, setNiche] = useState('Clínicas odontológicas')
  const [location, setLocation] = useState('São Paulo, SP')
  const [country, setCountry] = useState<string>('BR')

  /** Dispara a demo ao vivo e rola até ela. */
  const runSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('phl:run-search'))
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
      {/* Fundo: grid de pontos + halos laranja/azul */}
      <div className="bg-dot-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-orange-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute top-40 -right-40 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-32 h-72 w-72 rounded-full bg-orange-300/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge de lançamento */}
          <Badge
            variant="outline"
            className="mb-6 max-w-full gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3.5 py-1.5 text-[13px] font-medium leading-snug text-orange-700 whitespace-normal"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Novo · Busca global multi-fonte com dedup automático
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-[3.6rem] lg:leading-[1.08]">
            Nicho + cidade viram{' '}
            <span className="relative inline-block text-primary">
              leads quentes
              <svg
                className="absolute -bottom-1.5 left-0 w-full text-orange-300"
                viewBox="0 0 200 9"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 6.5C40 1.8 108 1.2 199 5.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            em segundos
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Dispare uma busca paralela em <strong className="font-semibold text-zinc-800">Google
            Places, Maps, Yelp, Yellow Pages e no site de cada empresa</strong>. O Play Hot
            Leads deduplica, valida telefones, enriquece com e-mails e entrega cards
            prontos pra contato — ao vivo, enquanto busca.
          </p>
        </div>

        {/* Mockup da barra de busca do produto */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div
            className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-950/5 ring-1 ring-orange-100/60"
            role="search"
            aria-label="Simulação da busca de leads"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.2fr_1fr_auto] lg:grid-cols-[1.3fr_1fr_auto_auto]">
              {/* Nicho */}
              <label className="group relative block">
                <span className="sr-only">Nicho</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden="true"
                />
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Nicho (ex.: dentista, pizzaria...)"
                  aria-label="Nicho"
                  className="h-11 rounded-xl border-zinc-200 bg-zinc-50/60 pl-9 text-sm font-medium transition-colors focus:bg-white"
                />
              </label>

              {/* Localização */}
              <label className="group relative block">
                <span className="sr-only">Localização</span>
                <MapPin
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden="true"
                />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Cidade ou região"
                  aria-label="Localização"
                  className="h-11 rounded-xl border-zinc-200 bg-zinc-50/60 pl-9 text-sm font-medium transition-colors focus:bg-white"
                />
              </label>

              {/* País */}
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger
                  aria-label="País"
                  className="h-11 w-full rounded-xl border-zinc-200 bg-zinc-50/60 text-sm font-medium sm:w-full lg:w-36"
                >
                  <Globe className="size-4 text-zinc-400" aria-hidden="true" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* CTA */}
              <Button
                onClick={runSearch}
                data-cta="hero-search"
                className="h-11 rounded-xl px-6 font-semibold shadow-lg shadow-orange-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Flame className="mr-1.5 size-4" aria-hidden="true" />
                Procurar leads
              </Button>
            </div>

            {/* Acesso ao produto real */}
            <div className="mt-3 flex justify-center sm:justify-end">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-sky-200 bg-sky-50 px-4 text-[12.5px] font-semibold text-sky-700 transition-colors hover:bg-sky-100"
              >
                <a href="#/app" data-cta="hero-open-app">
                  Abrir o app de verdade (busca, Kanban, campanhas)
                  <ArrowRight className="ml-1 size-3.5" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          {/* Micro-copy sob a busca */}
          <p className="mt-3 text-center text-[13px] text-zinc-500">
            Clique em{' '}
            <button
              onClick={runSearch}
              className="font-semibold text-primary underline decoration-orange-300 underline-offset-2 transition-colors hover:text-orange-700"
            >
              Procurar leads
            </button>{' '}
            pra ver a orquestração acontecendo de verdade, abaixo.
          </p>
        </div>

        {/* Destaques rápidos */}
        <ul className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm font-medium text-zinc-600">
              <span className="flex size-6 items-center justify-center rounded-md bg-sky-50 text-sky-600">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              {label}
            </li>
          ))}
        </ul>

        {/* Faixa de fontes */}
        <div className="mt-10">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
            Fontes agregadas numa única busca
          </p>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {PROVIDER_NAMES.map((name) => (
              <li
                key={name}
                className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-zinc-600 shadow-sm"
              >
                {name}
              </li>
            ))}
            <li className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-zinc-600 shadow-sm">
              + fontes por país
              <ChevronDown className="size-3.5 text-zinc-400" aria-hidden="true" />
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
