'use client'

// src/components/app/search-view.tsx
// Tela de busca: dispara POST /api/search e abre o SSE /api/search/stream.
// Cards pingam conforme o worker entrega; cancelamento propaga até os
// providers; snapshot permite reconexão; buscas recentes reabrem do banco.

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame,
  MapPin,
  Search,
  Globe,
  Star,
  Phone,
  Mail,
  MessageCircle,
  Globe as GlobeIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Ban,
  LayoutGrid,
  Building2,
  Copy,
} from 'lucide-react'
import { apiFetch, getTenantId, getSessionToken } from '@/lib/tenant-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from './i18n'
import { useAuth } from './auth-context'
import type { AppTab } from './app-shell'
import { COUNTRIES, COUNTRY_LIST } from '@/core/countries'
import type {
  CountryCode,
  KanbanStage,
  LeadDTO,
  ProviderId,
  ProviderRuntimeStatus,
  SearchSnapshotDTO,
  SearchStats,
} from '@/core/types'

interface RecentSearch {
  id: string
  niche: string
  location: string
  country: string
  status: string
  totalFound: number
}

type Phase = 'idle' | 'running' | 'done' | 'failed' | 'cancelled'

const SOURCE_DOT: Record<ProviderId, string> = {
  overpass: 'bg-lime-500',
  nominatim: 'bg-teal-500',
  photon: 'bg-cyan-500',
  websearch: 'bg-violet-500',
  'google-places': 'bg-sky-500',
  'maps-scraper': 'bg-emerald-500',
  yelp: 'bg-orange-500',
  yellowpages: 'bg-amber-500',
  serpapi: 'bg-zinc-400',
  'website-crawler': 'bg-fuchsia-400',
}

const SOURCE_LABEL: Record<ProviderId, string> = {
  overpass: 'OpenStreetMap',
  nominatim: 'Nominatim',
  photon: 'Photon',
  websearch: 'Busca Web',
  'google-places': 'Google Places',
  'maps-scraper': 'Maps',
  yelp: 'Yelp',
  yellowpages: 'Yellow Pages',
  serpapi: 'SerpAPI',
  'website-crawler': 'Crawl',
}

export function SearchView({
  visible,
  onGoTo,
}: {
  visible: boolean
  onGoTo: (tab: AppTab) => void
}) {
  const { t } = useI18n()
  const { refresh } = useAuth()

  const [niche, setNiche] = useState('Clínicas odontológicas')
  const [location, setLocation] = useState('São Paulo, SP')
  const [country, setCountry] = useState<CountryCode>('BR')
  const [limit, setLimit] = useState('80')

  const [phase, setPhase] = useState<Phase>('idle')
  const [searchId, setSearchId] = useState<string | null>(null)
  const [searchInfo, setSearchInfo] = useState<{ niche: string; location: string; country: string } | null>(null)
  const [providers, setProviders] = useState<ProviderRuntimeStatus[]>([])
  const [stats, setStats] = useState<SearchStats>({ unique: 0, duplicates: 0, enriched: 0 })
  const [leads, setLeads] = useState<LeadDTO[]>([])
  const [recent, setRecent] = useState<RecentSearch[]>([])

  const esRef = useRef<EventSource | null>(null)

  const loadRecent = useCallback(async () => {
    try {
      const res = await apiFetch('/api/searches')
      if (!res.ok) return
      const data = (await res.json()) as { searches: RecentSearch[] }
      setRecent(data.searches)
    } catch {
      // silencioso — lista é nice-to-have
    }
  }, [])

  const closeStream = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
  }, [])

  const applySnapshot = useCallback((data: SearchSnapshotDTO) => {
    setSearchInfo({ niche: data.niche, location: data.location, country: data.country })
    setStats(data.stats)
    setProviders(data.providers)
    setLeads(data.leads)
    setPhase(data.status === 'running' ? 'running' : data.status)
  }, [])

  /** Conecta no SSE da busca e aplica eventos ao estado local. */
  const openStream = useCallback(
    (id: string) => {
      closeStream()
      // tid + token: EventSource não envia headers — fallbacks p/ iframes
      // que bloqueiam cookies e p/ sessão
      const params = new URLSearchParams({ id, tid: getTenantId() })
      const token = getSessionToken()
      if (token) params.set('token', token)
      const es = new EventSource(`/api/search/stream?${params.toString()}`)
      esRef.current = es

      es.onmessage = (message: MessageEvent<string>) => {
        let event: import('@/core/types').SearchEvent
        try {
          event = JSON.parse(message.data) as import('@/core/types').SearchEvent
        } catch {
          return
        }
        switch (event.type) {
          case 'snapshot':
            applySnapshot(event.data)
            break
          case 'provider':
            setProviders((prev) => upsertProvider(prev, event))
            break
          case 'lead':
            setLeads((prev) => (prev.some((l) => l.id === event.lead.id) ? prev : [event.lead, ...prev]))
            setStats((s) => ({ ...s, unique: s.unique + 1 }))
            break
          case 'update':
            setLeads((prev) => prev.map((l) => (l.id === event.lead.id ? event.lead : l)))
            break
          case 'dedup':
            setStats((s) => ({ ...s, duplicates: s.duplicates + 1 }))
            break
          case 'done':
            setStats(event.stats)
            setPhase('done')
            void loadRecent() // atualiza contador das buscas recentes
            void refresh() // créditos debitados por lead — navbar atualiza
            break
          case 'cancelled':
            setPhase('cancelled')
            break
          case 'error':
            setPhase('failed')
            toast.error(event.message)
            break
          default:
            break
        }
      }
    },
    [closeStream, applySnapshot, loadRecent, refresh],
  )

  /** Inicia uma busca nova. */
  const startSearch = useCallback(async () => {
    setPhase('running')
    setLeads([])
    setProviders([])
    setStats({ unique: 0, duplicates: 0, enriched: 0 })
    setSearchInfo({ niche, location, country })

    try {
      const res = await apiFetch('/api/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ niche, location, country, limit: Number(limit) || 80 }),
      })
      const data = (await res.json()) as { id?: string; error?: string }
      if (res.status === 402) {
        // sem créditos: mensagem do server + leva o usuário para os planos
        setPhase('idle')
        toast.error(data.error ?? t('common.error'))
        onGoTo('billing')
        return
      }
      if (!res.ok || !data.id) {
        throw new Error(data.error ?? 'falha ao iniciar busca')
      }
      setSearchId(data.id)
      openStream(data.id)
      void refresh() // navbar: atualiza o saldo de créditos após o débito
      void loadRecent()
    } catch (err) {
      setPhase('failed')
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }, [niche, location, country, limit, openStream, closeStream, loadRecent, refresh, onGoTo, t])

  /** Reabre uma busca recente (snapshot do banco). */
  const openRecent = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`/api/search/${id}`)
        if (!res.ok) throw new Error('não foi possível abrir a busca')
        const data = (await res.json()) as SearchSnapshotDTO
        setSearchId(id)
        applySnapshot(data)
        if (data.status === 'running') openStream(id)
        else closeStream()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err))
      }
    },
    [applySnapshot, openStream, closeStream],
  )

  const cancelSearch = useCallback(async () => {
    if (!searchId) return
    await apiFetch(`/api/search/${searchId}`, { method: 'DELETE' }).catch(() => undefined)
  }, [searchId])

  useEffect(() => {
    if (visible) void loadRecent()
  }, [visible, loadRecent])

  useEffect(() => () => closeStream(), [closeStream])

  const activeProviders = providers.filter((p) => p.status !== 'waiting')
  const sourcesActive = `${activeProviders.filter((p) => p.status === 'searching' || p.status === 'done').length}/${activeProviders.length || 5}`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      {/* -------- Coluna: formulário -------- */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold text-zinc-900">{t('search.title')}</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{t('search.subtitle')}</p>

          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (phase !== 'running') void startSearch()
            }}
          >
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-semibold text-zinc-700">{t('search.niche')}</span>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder={t('search.niche.ph')}
                className="h-10 rounded-xl"
                required
                minLength={2}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12.5px] font-semibold text-zinc-700">{t('search.location')}</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('search.location.ph')}
                  className="h-10 rounded-xl pl-9"
                  required
                  minLength={2}
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-semibold text-zinc-700">{t('search.country')}</span>
                <Select value={country} onValueChange={(v) => setCountry(v as CountryCode)}>
                  <SelectTrigger className="h-10 w-full rounded-xl">
                    <Globe className="size-3.5 text-zinc-400" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_LIST.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[12.5px] font-semibold text-zinc-700">{t('search.limit')}</span>
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger className="h-10 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['30', '80', '150', '300'].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            {phase === 'running' ? (
              <Button type="button" variant="outline" onClick={() => void cancelSearch()} className="h-10 w-full rounded-xl font-semibold">
                <Ban className="mr-1.5 size-4 text-red-500" aria-hidden="true" />
                {t('search.cancel')}
              </Button>
            ) : (
              <Button type="submit" className="h-10 w-full rounded-xl font-semibold shadow-lg shadow-orange-600/25">
                <Flame className="mr-1.5 size-4" aria-hidden="true" />
                {t('search.start')}
              </Button>
            )}
          </form>

          <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-[11.5px] leading-relaxed text-sky-700">
            {t('search.demoNote')}
          </p>
        </div>

        {/* Buscas recentes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-[13.5px] font-bold text-zinc-900">
            <History className="size-4 text-zinc-400" aria-hidden="true" />
            {t('search.recent')}
          </h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-zinc-500">{t('search.recentEmpty')}</p>
          ) : (
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto scrollbar-slim">
              {recent.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => void openRecent(s.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                      searchId === s.id
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <p className="truncate text-[13px] font-semibold text-zinc-800">{s.niche}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-zinc-500">
                      <MapPin className="size-3" aria-hidden="true" />
                      {s.location} · {COUNTRIES[(s.country as CountryCode) ?? 'BR']?.flag ?? s.country} · {s.totalFound} leads
                      {s.status === 'done' && <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />}
                      {s.status === 'running' && <Loader2 className="size-3 animate-spin text-orange-500" aria-hidden="true" />}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* -------- Coluna: resultados -------- */}
      <div className="space-y-4">
        {/* Barra de status */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          {searchInfo ? (
            <>
              <Badge variant="outline" className="rounded-lg bg-zinc-50 px-2 py-1 text-[12px] font-medium text-zinc-700">
                {searchInfo.niche}
              </Badge>
              <Badge variant="outline" className="rounded-lg bg-zinc-50 px-2 py-1 text-[12px] font-medium text-zinc-700">
                {searchInfo.location} · {COUNTRIES[searchInfo.country as CountryCode]?.flag ?? ''}
              </Badge>
            </>
          ) : (
            <p className="text-[13px] text-zinc-500">{t('search.subtitle')}</p>
          )}
          <span className="ml-auto">
            <StatusBadge phase={phase} />
          </span>
        </div>

        {/* Stats + providers */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t('search.stats.unique')} value={stats.unique} accent="text-zinc-900" />
          <StatCard label={t('search.stats.duplicates')} value={stats.duplicates} accent="text-amber-600" />
          <StatCard label={t('search.stats.enriched')} value={stats.enriched} accent="text-sky-600" />
          <StatCard label={t('search.stats.sources')} value={sourcesActive} accent="text-primary" />
        </div>

        {/* Chips de providers */}
        {activeProviders.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {activeProviders.map((p) => (
              <li
                key={p.id}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${
                  p.status === 'error'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : p.status === 'done'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 bg-white text-zinc-600'
                }`}
              >
                <span className={`size-1.5 rounded-full ${SOURCE_DOT[p.id]}`} aria-hidden="true" />
                {SOURCE_LABEL[p.id]}
                {p.status === 'searching' && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                {p.status === 'done' && <span className="font-bold">{p.found}</span>}
                {p.status === 'error' && (
                  <span className="flex items-center gap-1" title={p.note}>
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    isolado
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Grid de cards */}
        {phase === 'idle' && (
          <EmptyState
            icon={Flame}
            title={t('search.title')}
            body={t('search.subtitle')}
          />
        )}

        {phase !== 'idle' && leads.length === 0 && phase !== 'done' && (
          <div className="flex h-48 items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white text-zinc-500">
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
            <span className="text-sm">{t('search.running')}</span>
          </div>
        )}

        {phase === 'done' && leads.length === 0 && (
          <EmptyState icon={AlertTriangle} title={t('search.done')} body={t('search.openSettings')} />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {leads.map((lead) => (
              <motion.article
                key={lead.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                      <Building2 className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="truncate text-[14px] font-bold text-zinc-900">{lead.name}</h3>
                  </div>
                  {lead.rating !== null && (
                    <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-amber-500">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {lead.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-1.5">
                  {lead.phone && (
                    <p className="flex items-center gap-2 text-[12.5px] text-zinc-600">
                      <Phone className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                      {lead.phone}
                      {lead.whatsapp && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-600">
                          <MessageCircle className="size-3" aria-hidden="true" />
                          {t('leads.whatsapp')}
                        </span>
                      )}
                    </p>
                  )}
                  {lead.email && (
                    <motion.p
                      key={`${lead.id}-email`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 truncate text-[12.5px] font-medium text-sky-600"
                    >
                      <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                      {lead.email}
                    </motion.p>
                  )}
                  {lead.website && (
                    <p className="flex items-center gap-2 truncate text-[12.5px] text-zinc-500">
                      <GlobeIcon className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                      {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-2.5">
                  {lead.sources.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600"
                    >
                      <span className={`size-1.5 rounded-full ${SOURCE_DOT[s]}`} aria-hidden="true" />
                      {SOURCE_LABEL[s]}
                    </span>
                  ))}
                  {lead.sources.length > 1 && (
                    <span className="ml-auto text-[10.5px] font-bold text-primary">
                      {lead.sources.length} fontes ✓
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {phase === 'done' && leads.length > 0 && (
          <div className="flex justify-center pb-4">
            <Button onClick={() => onGoTo('kanban')} className="rounded-full px-6 font-semibold shadow-lg shadow-orange-600/25">
              <LayoutGrid className="mr-1.5 size-4" aria-hidden="true" />
              {t('search.viewKanban')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function upsertProvider(
  prev: ProviderRuntimeStatus[],
  event: Extract<import('@/core/types').SearchEvent, { type: 'provider' }>,
): ProviderRuntimeStatus[] {
  const existing = prev.find((p) => p.id === event.id)
  if (existing) {
    return prev.map((p) =>
      p.id === event.id
        ? { ...p, status: event.status, found: event.found ?? p.found, note: event.note ?? p.note }
        : p,
    )
  }
  return [...prev, { id: event.id, status: event.status, found: event.found ?? 0, note: event.note }]
}

function StatusBadge({ phase }: { phase: Phase }) {
  const { t } = useI18n()
  if (phase === 'running') {
    return (
      <Badge className="gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-orange-700">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        {t('search.running')}
      </Badge>
    )
  }
  if (phase === 'done') {
    return (
      <Badge className="gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        {t('search.done')}
      </Badge>
    )
  }
  if (phase === 'failed') {
    return (
      <Badge className="gap-1.5 rounded-full bg-red-100 px-3 py-1 text-red-700">
        <XCircle className="size-3.5" aria-hidden="true" />
        {t('search.failed')}
      </Badge>
    )
  }
  if (phase === 'cancelled') {
    return (
      <Badge className="gap-1.5 rounded-full bg-zinc-200 px-3 py-1 text-zinc-600">
        <Ban className="size-3.5" aria-hidden="true" />
        {t('search.cancelled')}
      </Badge>
    )
  }
  return null
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className={`text-xl font-extrabold tabular-nums ${accent}`}>{value}</p>
      <p className="mt-0.5 text-[11.5px] font-medium text-zinc-500">{label}</p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Flame
  title: string
  body: string
}) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-50 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-[15px] font-bold text-zinc-800">{title}</p>
      <p className="max-w-xs text-[13px] text-zinc-500">{body}</p>
    </div>
  )
}
