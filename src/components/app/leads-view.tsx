'use client'

// src/components/app/leads-view.tsx
// Lista de todos os leads com filtros + ações rápidas (copiar, wa.me,
// mover estágio, detalhes).

import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  Phone,
  Mail,
  MessageCircle,
  Star,
  Search as SearchIcon,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/tenant-client'
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
import { LeadDetail } from './lead-detail'
import { COUNTRY_LIST } from '@/core/countries'
import { KANBAN_STAGES, type KanbanStage, type LeadDTO, type ProviderId } from '@/core/types'

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

const STAGE_LABEL_KEY: Record<KanbanStage, string> = {
  new: 'stage.new',
  contacted: 'stage.contacted',
  negotiation: 'stage.negotiation',
  won: 'stage.won',
  lost: 'stage.lost',
}

export function LeadsView({ visible }: { visible: boolean }) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState<string>('all')
  const [country, setCountry] = useState<string>('all')
  const [leads, setLeads] = useState<LeadDTO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<LeadDTO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '100' })
      if (q.trim()) params.set('q', q.trim())
      if (stage !== 'all') params.set('stage', stage)
      if (country !== 'all') params.set('country', country)
      const res = await apiFetch(`/api/leads?${params.toString()}`)
      if (!res.ok) return
      const data = (await res.json()) as { leads: LeadDTO[]; total: number }
      setLeads(data.leads)
      setTotal(data.total)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [q, stage, country, t])

  useEffect(() => {
    if (visible) void load()
  }, [visible, load])

  const copy = async (value: string, labelKey: string) => {
    await navigator.clipboard.writeText(value).catch(() => undefined)
    toast.success(`${t(labelKey)} · ${t('leads.copied')}`)
  }

  const quickMove = async (lead: LeadDTO, target: KanbanStage) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, kanbanStage: target } : l)))
    await apiFetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kanbanStage: target }),
    }).catch(() => toast.error(t('common.error')))
  }

  const onLeadSaved = useCallback((saved: LeadDTO) => {
    setLeads((prev) => prev.map((l) => (l.id === saved.id ? saved : l)))
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-5 text-primary" aria-hidden="true" />
        <h1 className="text-lg font-bold text-zinc-900">{t('leads.title')}</h1>
        <Badge variant="outline" className="rounded-full bg-zinc-50 text-[12px] font-bold text-zinc-600">
          {total}
        </Badge>
      </div>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('leads.q.ph')}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="h-10 rounded-xl sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('leads.stage.all')}</SelectItem>
            {KANBAN_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(STAGE_LABEL_KEY[s])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="h-10 rounded-xl sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌐</SelectItem>
            {COUNTRY_LIST.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid h-48 place-items-center text-zinc-500">{t('common.loading')}…</div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-[14px] text-zinc-500">
          {t('leads.empty')}
        </div>
      ) : (
        <ul className="space-y-2 pb-6">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-col gap-2.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <button onClick={() => setDetail(lead)} className="min-w-0 flex-1 text-left">
                <p className="flex items-center gap-2 text-[14px] font-bold text-zinc-900">
                  <span className="truncate">{lead.name}</span>
                  {lead.rating !== null && (
                    <span className="flex shrink-0 items-center gap-0.5 text-[12px] text-amber-500">
                      <Star className="size-3.5 fill-amber-400" aria-hidden="true" />
                      {lead.rating.toFixed(1)}
                    </span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-zinc-600">
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5 text-zinc-400" aria-hidden="true" />
                      {lead.phone}
                    </span>
                  )}
                  {lead.whatsapp && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                      {t('leads.whatsapp')}
                    </span>
                  )}
                  {lead.email && (
                    <span className="flex items-center gap-1 truncate text-sky-600">
                      <Mail className="size-3.5" aria-hidden="true" />
                      {lead.email}
                    </span>
                  )}
                  {lead.website && (
                    <span className="flex items-center gap-1 truncate text-zinc-500">
                      <ExternalLink className="size-3 text-zinc-400" aria-hidden="true" />
                      {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </span>
                  )}
                </p>
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  {lead.sources.map((s) => (
                    <Badge key={s} variant="outline" className="rounded-md bg-zinc-50 px-1.5 py-0 text-[10.5px] font-medium text-zinc-600">
                      {SOURCE_LABEL[s]}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="rounded-md bg-orange-50 px-1.5 py-0 text-[10.5px] font-bold text-orange-600">
                    {t(STAGE_LABEL_KEY[lead.kanbanStage])}
                  </Badge>
                </p>
              </button>

              <div className="flex shrink-0 items-center gap-1.5">
                {lead.phone && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    onClick={() => void copy(lead.phone ?? '', 'leads.copy.phone')}
                    aria-label={t('leads.copy.phone')}
                  >
                    <Copy className="size-3.5" aria-hidden="true" />
                  </Button>
                )}
                {lead.whatsapp && lead.phoneE164 && (
                  <Button asChild size="icon" className="size-8 rounded-lg bg-emerald-600 hover:bg-emerald-700">
                    <a
                      href={`https://wa.me/${lead.phoneE164.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t('kanban.wame')}
                    >
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                    </a>
                  </Button>
                )}
                <Select value={lead.kanbanStage} onValueChange={(v) => void quickMove(lead, v as KanbanStage)}>
                  <SelectTrigger aria-label={t('kanban.stage')} className="h-8 w-[130px] rounded-lg text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(STAGE_LABEL_KEY[s])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LeadDetail
        lead={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        onSaved={onLeadSaved}
      />
    </div>
  )
}
