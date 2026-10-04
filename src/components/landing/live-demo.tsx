'use client'

// src/components/landing/live-demo.tsx
// Demonstração interativa do orquestrador do Play Hot Leads.
// Simula (de forma determinística) o fluxo real do produto:
//   1. Busca dispara em paralelo em N providers
//   2. Cards de leads "pingam" na tela conforme chegam (como no SSE real)
//   3. Deduplicação por phone+domain+nome remove repetidos na hora
//   4. Provider com erro é ISOLADO e a busca continua
//   5. Crawl do site enriquece leads que tinham site mas não tinham e-mail
//
// Auto-inicia quando entra na viewport e pode ser reiniciado pelo Hero
// via CustomEvent 'phl:run-search'.

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Building2,
  Star,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  Terminal,
  Flame,
  RefreshCw,
  Timer,
  Copy,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/* ------------------------------------------------------------------ */
/* Tipos                                                                */
/* ------------------------------------------------------------------ */

type SourceId =
  | 'google-places'
  | 'maps-scraper'
  | 'yelp'
  | 'yellowpages'
  | 'serpapi'
  | 'website-crawler'

type ProviderStatus = 'waiting' | 'searching' | 'done' | 'error'

type DemoLead = {
  id: number
  kind: 'lead' | 'duplicate'
  name: string
  phone?: string
  whatsapp?: boolean
  email?: string
  site?: string
  rating?: number
  sources: SourceId[]
}

type ProviderState = {
  id: SourceId
  status: ProviderStatus
  found: number
  note?: string
}

type LogLine = { id: number; time: string; text: string; tone: 'info' | 'warn' | 'ok' | 'dim' }

/* ------------------------------------------------------------------ */
/* Metadados das fontes                                                 */
/* ------------------------------------------------------------------ */

const SOURCE_META: Record<SourceId, { label: string; dot: string }> = {
  'google-places': { label: 'Google Places', dot: 'bg-sky-500' },
  'maps-scraper': { label: 'Google Maps', dot: 'bg-emerald-500' },
  yelp: { label: 'Yelp', dot: 'bg-orange-500' },
  yellowpages: { label: 'Yellow Pages', dot: 'bg-amber-500' },
  serpapi: { label: 'SerpAPI', dot: 'bg-zinc-400' },
  'website-crawler': { label: 'Crawl do site', dot: 'bg-fuchsia-400' },
}

const SEARCH_PROVIDERS: SourceId[] = [
  'google-places',
  'maps-scraper',
  'yelp',
  'yellowpages',
  'serpapi',
]

const INITIAL_PROVIDERS: ProviderState[] = [
  ...SEARCH_PROVIDERS.map((id) => ({ id, status: 'waiting' as const, found: 0 })),
  { id: 'website-crawler', status: 'waiting', found: 0, note: 'enriquecimento' },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function clockNow(): string {
  const d = new Date()
  return d.toLocaleTimeString('pt-BR', { hour12: false })
}

/* ------------------------------------------------------------------ */
/* Componente                                                           */
/* ------------------------------------------------------------------ */

export function LiveDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { once: true, margin: '-15% 0px' })
  const runIdRef = useRef(0)
  const leadIdRef = useRef(0)
  const logIdRef = useRef(0)
  const startedOnceRef = useRef(false)
  const logBoxRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [leads, setLeads] = useState<DemoLead[]>([])
  const [duplicates, setDuplicates] = useState(0)
  const [enriched, setEnriched] = useState(0)
  const [providers, setProviders] = useState<ProviderState[]>(INITIAL_PROVIDERS)
  const [logs, setLogs] = useState<LogLine[]>([])

  /* ---------- primitivas de estado ---------- */

  const pushLog = useCallback((text: string, tone: LogLine['tone'] = 'info') => {
    logIdRef.current += 1
    // id capturado em const local: o updater roda depois (batching) e ler
    // o ref direto daria o mesmo id pra duas linhas enfileiradas
    const id = logIdRef.current
    const entry: LogLine = { id, time: clockNow(), text, tone }
    setLogs((prev) => [...prev.slice(-60), entry])
  }, [])

  const setProvider = useCallback((id: SourceId, patch: Partial<ProviderState>) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const addLead = useCallback(
    (lead: Omit<DemoLead, 'id'>) => {
      leadIdRef.current += 1
      // mesmo padrão do pushLog: id fixado fora do updater (batch-safe)
      const id = leadIdRef.current
      setLeads((prev) => [{ ...lead, id }, ...prev].slice(0, 40))
      if (lead.kind === 'duplicate') setDuplicates((d) => d + 1)
    },
    [],
  )

  const enrichLead = useCallback((id: number, email: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, email } : l)))
  }, [])

  /* ---------- sleep com token anti-stale ---------- */

  const sleep = useCallback(async (ms: number) => {
    const token = runIdRef.current
    await new Promise<void>((resolve) => setTimeout(resolve, ms))
    if (runIdRef.current !== token) {
      throw new Error('run-cancelled')
    }
  }, [])

  /* ---------- roteiro da busca (10s, determinístico) ---------- */

  const run = useCallback(async () => {
    const t0 = Date.now()

    pushLog(`orquestrador ▶ busca iniciada — "Clínicas odontológicas" @ São Paulo, BR`, 'ok')
    for (const id of SEARCH_PROVIDERS) setProvider(id, { status: 'searching' })
    pushLog(`5 providers habilitados · proxy off · rate-limit por fonte`, 'dim')
    await sleep(900)

    // -- Google Places começa a devolver o dado mais limpo
    setProvider('google-places', { found: 1 })
    addLead({
      kind: 'lead',
      name: 'Odonto Prime',
      phone: '+55 11 3045-2210',
      whatsapp: true,
      site: 'odontoprime.com.br',
      rating: 4.8,
      sources: ['google-places'],
    })
    pushLog(`google-places · lead "Odonto Prime" ★4.8`, 'info')
    await sleep(520)

    setProvider('google-places', { found: 2 })
    addLead({
      kind: 'lead',
      name: 'Sorrir+ Odontologia',
      phone: '+55 11 3266-1180',
      site: 'sorrirmais.com.br',
      rating: 4.6,
      sources: ['google-places'],
    })
    pushLog(`google-places · lead "Sorrir+ Odontologia" ★4.6`, 'info')
    await sleep(430)

    // -- Maps bate no mesmo lead → dedup na hora
    setProvider('maps-scraper', { found: 1 })
    addLead({
      kind: 'duplicate',
      name: 'Odonto Prime',
      sources: ['maps-scraper'],
    })
    pushLog(`dedup ▸ "Odonto Prime" já existe (mesmo phone+domain) — ignorado`, 'warn')
    await sleep(520)

    setProvider('yelp', { found: 1 })
    addLead({
      kind: 'lead',
      name: 'Clínica Dental Sorriso Real',
      phone: '+55 11 3811-4402',
      rating: 4.4,
      sources: ['yelp'],
    })
    pushLog(`yelp · lead "Clínica Dental Sorriso Real" ★4.4`, 'info')
    await sleep(620)

    // -- Enriquecimento: Sorrir+ tem site mas não tinha e-mail
    setProvider('website-crawler', { status: 'searching' })
    pushLog(`fila ▸ crawl do site sorrirmais.com.br (falta e-mail)`, 'dim')
    await sleep(700)
    setProvider('website-crawler', { found: 1 })
    enrichLead(2, 'contato@sorrirmais.com.br')
    setEnriched((e) => e + 1)
    pushLog(`crawl ▸ e-mail contato@sorrirmais.com.br achado na página /contato`, 'ok')
    await sleep(480)

    setProvider('google-places', { found: 3 })
    addLead({
      kind: 'lead',
      name: 'Instituto da Dor Facial',
      phone: '+55 11 3555-9021',
      whatsapp: true,
      rating: 4.9,
      sources: ['google-places'],
    })
    pushLog(`google-places · lead "Instituto da Dor Facial" ★4.9`, 'info')
    await sleep(420)

    setProvider('yellowpages', { found: 1 })
    addLead({
      kind: 'lead',
      name: 'OdontoVida Paulista',
      phone: '+55 11 3777-6608',
      rating: 4.2,
      sources: ['yellowpages'],
    })
    pushLog(`yellow-pages · lead "OdontoVida Paulista"`, 'info')
    await sleep(560)

    // -- Maps é bloqueado → provider isolado, busca segue viva
    setProvider('maps-scraper', {
      status: 'error',
      note: 'HTTP 429 — rate limit',
    })
    pushLog(`maps-scraper ✖ HTTP 429 — provider isolado, a busca continua`, 'warn')
    await sleep(700)

    setProvider('yelp', { found: 2 })
    addLead({
      kind: 'lead',
      name: 'Dental Excelência',
      phone: '+55 11 3061-7788',
      whatsapp: true,
      rating: 4.5,
      sources: ['yelp'],
    })
    pushLog(`yelp · lead "Dental Excelência" ★4.5`, 'info')
    await sleep(560)

    // -- Lead visto em 2 fontes → prova multi-fonte no card
    setProvider('google-places', { found: 4 })
    setProvider('yelp', { found: 3 })
    addLead({
      kind: 'lead',
      name: 'Clínica Bem Estar',
      phone: '+55 11 3244-0912',
      site: 'cliniciabemestar.com.br',
      rating: 4.7,
      sources: ['google-places', 'yelp'],
    })
    pushLog(`merge ▸ "Clínica Bem Estar" veio do Places + Yelp → badge 2 fontes`, 'ok')
    await sleep(560)

    setProvider('serpapi', { found: 1 })
    addLead({
      kind: 'lead',
      name: 'Consultório Dra. Camila Ruiz',
      site: 'drcamilaruiz.com.br',
      sources: ['serpapi'],
    })
    pushLog(`serpapi · lead "Consultório Dra. Camila Ruiz" (busca orgânica)`, 'info')
    await sleep(600)

    setProvider('website-crawler', { found: 2 })
    enrichLead(10, 'contato@drcamilaruiz.com.br')
    setEnriched((e) => e + 1)
    pushLog(`crawl ▸ e-mail contato@drcamilaruiz.com.br achado via schema.org`, 'ok')
    await sleep(480)

    setProvider('google-places', { found: 5 })
    addLead({
      kind: 'lead',
      name: 'OdontoKids Paulista',
      phone: '+55 11 3885-1234',
      whatsapp: true,
      rating: 4.6,
      sources: ['google-places'],
    })
    pushLog(`google-places · lead "OdontoKids Paulista" ★4.6`, 'info')
    await sleep(440)

    setProvider('maps-scraper', { found: 2, status: 'searching', note: undefined })
    addLead({
      kind: 'duplicate',
      name: 'Sorrir+ Odontologia',
      sources: ['maps-scraper'],
    })
    pushLog(`dedup ▸ "Sorrir+ Odontologia" já existe — ignorado`, 'warn')
    await sleep(560)

    setProvider('yelp', { found: 4 })
    addLead({
      kind: 'lead',
      name: 'Sorriso Perfeito JK',
      phone: '+55 11 3082-5566',
      rating: 4.3,
      sources: ['yelp'],
    })
    pushLog(`yelp · lead "Sorriso Perfeito JK" ★4.3`, 'info')
    await sleep(460)

    setProvider('yellowpages', { found: 2 })
    addLead({
      kind: 'lead',
      name: 'Centro Odontológico Aurora',
      phone: '+55 11 3209-8844',
      site: 'auroraodontologia.com.br',
      rating: 4.1,
      sources: ['yellowpages'],
    })
    pushLog(`yellow-pages · lead "Centro Odontológico Aurora"`, 'info')
    await sleep(540)

    setProvider('website-crawler', { found: 3 })
    enrichLead(12, 'agenda@auroraodontologia.com.br')
    setEnriched((e) => e + 1)
    pushLog(`crawl ▸ e-mail agenda@auroraodontologia.com.br achado no rodapé`, 'ok')
    await sleep(460)

    setProvider('google-places', { found: 6 })
    addLead({
      kind: 'lead',
      name: 'Dra. Beatriz Lins Odontologia',
      phone: '+55 11 3021-4477',
      whatsapp: true,
      rating: 5.0,
      sources: ['google-places'],
    })
    pushLog(`google-places · lead "Dra. Beatriz Lins Odontologia" ★5.0`, 'info')
    await sleep(480)

    setProvider('maps-scraper', { found: 3 })
    addLead({
      kind: 'duplicate',
      name: 'Dra. Beatriz Lins Odontologia',
      sources: ['maps-scraper'],
    })
    pushLog(`dedup ▸ "Dra. Beatriz Lins" já existe — ignorado`, 'warn')
    await sleep(540)

    setProvider('yelp', { found: 5 })
    addLead({
      kind: 'lead',
      name: 'Clínica Sorriso do Bixiga',
      phone: '+55 11 3255-0090',
      rating: 4.4,
      sources: ['yelp'],
    })
    pushLog(`yelp · lead "Clínica Sorriso do Bixiga" ★4.4`, 'info')
    await sleep(460)

    setProvider('serpapi', { found: 2 })
    addLead({
      kind: 'lead',
      name: 'Odonto Studio Vila Madalena',
      phone: '+55 11 3956-7812',
      whatsapp: true,
      site: 'odontostudiovm.com.br',
      rating: 4.8,
      sources: ['serpapi'],
    })
    pushLog(`serpapi · lead "Odonto Studio Vila Madalena" ★4.8`, 'info')
    await sleep(620)

    // -- Encerramento
    setProvider('google-places', { status: 'done', found: 6 })
    setProvider('yelp', { status: 'done', found: 5 })
    setProvider('yellowpages', { status: 'done', found: 2 })
    setProvider('serpapi', { status: 'done', found: 2 })
    setProvider('maps-scraper', { status: 'done', found: 3, note: 'duplicados já cobertos' })
    setProvider('website-crawler', { status: 'done', found: 3 })
    await sleep(400)

    const secs = ((Date.now() - t0) / 1000).toFixed(1)
    pushLog(`busca concluída em ${secs}s · 14 únicos · 3 duplicados · 3 enriquecidos`, 'ok')
    setPhase('done')
  }, [addLead, enrichLead, pushLog, setProvider, sleep])

  /* ---------- start/restart ---------- */

  const start = useCallback(() => {
    runIdRef.current += 1
    leadIdRef.current = 0
    setPhase('running')
    setElapsed(0)
    setLeads([])
    setDuplicates(0)
    setEnriched(0)
    setProviders(INITIAL_PROVIDERS.map((p) => ({ ...p })))
    setLogs([])
    void run().catch((err: unknown) => {
      if (err instanceof Error && err.message === 'run-cancelled') return
      console.error('live-demo: falha no roteiro', err)
    })
  }, [run])

  /* auto-start ao entrar na viewport (uma única vez) — diferido fora do
     corpo do effect pra evitar setState síncrono em cascata */
  useEffect(() => {
    if (!inView || startedOnceRef.current) return
    startedOnceRef.current = true
    const timer = setTimeout(() => start(), 60)
    return () => clearTimeout(timer)
  }, [inView, start])

  /* restart via Hero */
  useEffect(() => {
    const onRunSearch = () => start()
    window.addEventListener('phl:run-search', onRunSearch)
    return () => window.removeEventListener('phl:run-search', onRunSearch)
  }, [start])

  /* cronômetro enquanto roda */
  useEffect(() => {
    if (phase !== 'running') return
    const timer = setInterval(() => setElapsed((e) => e + 0.2), 200)
    return () => clearInterval(timer)
  }, [phase])

  /* auto-scroll do terminal de eventos */
  useEffect(() => {
    const box = logBoxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [logs])

  const totalUnique = leads.filter((l) => l.kind === 'lead').length

  /* ---------- sub-componentes de UI ---------- */

  const statusBadge =
    phase === 'running' ? (
      <Badge className="gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-orange-400 ring-1 ring-orange-500/30">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Buscando…
      </Badge>
    ) : phase === 'done' ? (
      <Badge className="gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-400 ring-1 ring-emerald-500/30">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Concluída
      </Badge>
    ) : (
      <Badge className="rounded-full bg-zinc-500/15 px-3 py-1 text-zinc-400 ring-1 ring-zinc-500/30">
        Aguardando
      </Badge>
    )

  return (
    <section id="demo" ref={rootRef} className="scroll-mt-20 bg-zinc-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da seção */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-orange-400 uppercase">
            Simulação de vitrine
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Veja o motor trabalhando
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
            Esta é uma simulação com dados canned para mostrar o fluxo visual (fontes paralelas,
            dedup, erro isolado, crawl). A busca <strong className="text-orange-300">real</strong> roda
            no app contra OpenStreetMap, Photon, Nominatim e o índice de busca — dezenas de leads
            reais com telefone, WhatsApp e e-mail.
          </p>
          <a
            href="#/app"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400"
          >
            Rodar busca real grátis →
          </a>
        </div>

        {/* Janela do produto */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
          {/* Barra da janela */}
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="size-3 rounded-full bg-zinc-700" />
                <span className="size-3 rounded-full bg-zinc-700" />
                <span className="size-3 rounded-full bg-orange-500/70" />
              </div>
              <span className="hidden text-[13px] font-medium text-zinc-500 sm:inline">
                Play Hot Leads · busca #4821
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-[13px] text-zinc-500 sm:flex">
                <Timer className="size-3.5" aria-hidden="true" />
                {elapsed.toFixed(1)}s
              </span>
              {statusBadge}
            </div>
          </div>

          {/* Resumo da busca */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/40 px-4 py-3">
            <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-[12px] font-medium text-zinc-300">
              Nicho: <strong className="font-semibold text-white">Clínicas odontológicas</strong>
            </span>
            <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-[12px] font-medium text-zinc-300">
              Onde: <strong className="font-semibold text-white">São Paulo, SP</strong>
            </span>
            <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-[12px] font-medium text-zinc-300">
              País: <strong className="font-semibold text-white">🇧🇷 BR</strong>
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-px border-b border-zinc-800 bg-zinc-800 sm:grid-cols-4">
            <Stat label="Leads únicos" value={totalUnique} accent="text-white" />
            <Stat label="Duplicados ignorados" value={duplicates} accent="text-amber-400" />
            <Stat label="Enriquecidos (crawl)" value={enriched} accent="text-sky-400" />
            <Stat
              label="Fontes ativas"
              value={`${providers.filter((p) => p.status === 'searching' || p.status === 'done').length}/6`}
              accent="text-orange-400"
            />
          </div>

          {/* Corpo: cards + painel lateral */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
            {/* Coluna de cards */}
            <div className="border-b border-zinc-800 lg:border-r lg:border-b-0">
              <div className="max-h-[26rem] min-h-[22rem] overflow-y-auto p-4 scrollbar-slim-dark">
                {totalUnique === 0 && phase === 'running' && (
                  <div className="flex h-56 flex-col items-center justify-center gap-3 text-zinc-600">
                    <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                    <p className="text-sm">Consultando as fontes…</p>
                  </div>
                )}

                {phase === 'idle' && (
                  <div className="flex h-56 flex-col items-center justify-center gap-3 text-zinc-600">
                    <Flame className="size-6 text-zinc-700" aria-hidden="true" />
                    <p className="text-sm">Aperte “Procurar leads” pra começar</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AnimatePresence initial={false}>
                    {leads.map((lead) =>
                      lead.kind === 'lead' ? (
                        <motion.article
                          key={lead.id}
                          layout
                          initial={{ opacity: 0, y: 18, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                                <Building2 className="size-4" aria-hidden="true" />
                              </span>
                              <h3 className="truncate text-[14px] font-semibold text-white">
                                {lead.name}
                              </h3>
                            </div>
                            {typeof lead.rating === 'number' && (
                              <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-amber-400">
                                <Star
                                  className="size-3.5 fill-amber-400"
                                  aria-hidden="true"
                                />
                                {lead.rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 space-y-1.5 pl-0.5">
                            {lead.phone && (
                              <p className="flex items-center gap-2 text-[12.5px] text-zinc-400">
                                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                                {lead.phone}
                                {lead.whatsapp && (
                                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-400">
                                    <MessageCircle className="size-3" aria-hidden="true" />
                                    WhatsApp
                                  </span>
                                )}
                              </p>
                            )}
                            {lead.email && (
                              <motion.p
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 truncate text-[12.5px] text-sky-400"
                              >
                                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                                {lead.email}
                              </motion.p>
                            )}
                            {lead.site && (
                              <p className="flex items-center gap-2 truncate text-[12.5px] text-zinc-500">
                                <Globe className="size-3.5 shrink-0" aria-hidden="true" />
                                {lead.site}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/70 pt-2.5">
                            {lead.sources.map((s) => (
                              <span
                                key={s}
                                className="flex items-center gap-1.5 rounded-md bg-zinc-800/70 px-1.5 py-0.5 text-[11px] font-medium text-zinc-300"
                              >
                                <span
                                  className={`size-1.5 rounded-full ${SOURCE_META[s].dot}`}
                                  aria-hidden="true"
                                />
                                {SOURCE_META[s].label}
                              </span>
                            ))}
                            {lead.sources.length > 1 && (
                              <span className="ml-auto text-[10.5px] font-semibold text-orange-400">
                                {lead.sources.length} fontes ✓
                              </span>
                            )}
                          </div>
                        </motion.article>
                      ) : (
                        /* ---------- duplicado ignorado ---------- */
                        <motion.div
                          key={lead.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="flex items-center gap-2.5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5"
                        >
                          <Copy className="size-4 shrink-0 text-zinc-600" aria-hidden="true" />
                          <p className="truncate text-[12.5px] text-zinc-500">
                            <span className="font-medium text-zinc-400">{lead.name}</span>
                            {' '}— duplicado ignorado ({SOURCE_META[lead.sources[0]].label})
                          </p>
                          <XCircle className="ml-auto size-4 shrink-0 text-amber-500/70" aria-hidden="true" />
                        </motion.div>
                      ),
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Coluna lateral: providers + terminal */}
            <div className="flex flex-col divide-y divide-zinc-800">
              <div className="p-4">
                <h4 className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Providers
                </h4>
                <ul className="space-y-2">
                  {providers.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2.5 rounded-lg bg-zinc-950/60 px-3 py-2"
                    >
                      <span
                        className={`size-2 shrink-0 rounded-full ${SOURCE_META[p.id].dot}`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-[13px] font-medium text-zinc-300">
                        {SOURCE_META[p.id].label}
                      </span>

                      <span className="ml-auto flex items-center gap-1.5 text-[12px]">
                        {p.status === 'waiting' && (
                          <span className="text-zinc-600">aguardando</span>
                        )}
                        {p.status === 'searching' && (
                          <Loader2
                            className="size-3.5 animate-spin text-orange-400"
                            aria-hidden="true"
                          />
                        )}
                        {p.status === 'done' && (
                          <>
                            <span className="font-semibold text-emerald-400">{p.found}</span>
                            <CheckCircle2 className="size-3.5 text-emerald-500" aria-hidden="true" />
                          </>
                        )}
                        {p.status === 'error' && (
                          <span
                            className="flex items-center gap-1 text-amber-400"
                            title={p.note}
                          >
                            <AlertTriangle className="size-3.5" aria-hidden="true" />
                            isolado
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 p-4">
                <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  <Terminal className="size-3.5" aria-hidden="true" />
                  Eventos (worker)
                </h4>
                <div
                  ref={logBoxRef}
                  className="h-40 overflow-y-auto rounded-lg bg-black/60 p-3 font-mono text-[11.5px] leading-relaxed scrollbar-slim-dark lg:h-full lg:max-h-44"
                  aria-live="polite"
                  aria-label="Log de eventos da busca"
                >
                  {logs.map((line) => (
                    <p
                      key={line.id}
                      className={
                        line.tone === 'ok'
                          ? 'text-emerald-400'
                          : line.tone === 'warn'
                            ? 'text-amber-400'
                            : line.tone === 'dim'
                              ? 'text-zinc-600'
                              : 'text-zinc-400'
                      }
                    >
                      <span className="text-zinc-700">{line.time}</span> {line.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            onClick={start}
            variant="secondary"
            className="rounded-full bg-white/10 px-6 font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
            {phase === 'done' ? 'Rodar de novo' : 'Reiniciar demonstração'}
          </Button>
          <p className="flex items-center gap-1.5 text-[13px] text-zinc-500">
            <Sparkles className="size-3.5 text-orange-400/80" aria-hidden="true" />
            No produto real os dados vêm das fontes de verdade via SSE — os cards pingam
            conforme o worker entrega.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Stat cell                                                            */
/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent: string
}) {
  return (
    <div className="bg-zinc-900 px-4 py-3.5">
      <p className={`text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="mt-0.5 text-[11.5px] font-medium text-zinc-500">{label}</p>
    </div>
  )
}
