'use client'

// src/components/app/campaigns-view.tsx
// Campanhas de WhatsApp: criação com template + variáveis, geração de
// template com IA (rota backend com Gemini), disparo segmentado
// por estágio e acompanhamento com polling enquanto roda.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MessageCircle,
  Send,
  Sparkles,
  Users,
  TrendingUp,
  CheckCheck,
  Clock,
  CircleCheck,
  CircleX,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/tenant-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from './i18n'
import { KANBAN_STAGES, type KanbanStage } from '@/core/types'

interface CampaignMessageDTO {
  id: string
  leadName: string
  status: string
  body: string
}

interface CampaignDTO {
  id: string
  name: string
  template: string
  stage: string
  status: string
  total: number
  sent: number
  delivered: number
  replied: number
  messages: CampaignMessageDTO[]
}

const STAGE_LABEL_KEY: Record<KanbanStage, string> = {
  new: 'stage.new',
  contacted: 'stage.contacted',
  negotiation: 'stage.negotiation',
  won: 'stage.won',
  lost: 'stage.lost',
}

export function CampaignsView({ visible }: { visible: boolean }) {
  const { t, language } = useI18n()

  const [name, setName] = useState('')
  const [template, setTemplate] = useState('')
  const [stage, setStage] = useState<KanbanStage>('new')
  const [creating, setCreating] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([])
  const templateRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/campaigns')
      if (!res.ok) return
      const data = (await res.json()) as { campaigns: CampaignDTO[] }
      setCampaigns(data.campaigns)
    } catch {
      // silencioso no poll
    }
  }, [])

  useEffect(() => {
    if (visible) void load()
  }, [visible, load])

  // Poll enquanto houver campanha rodando (e a aba estiver visível)
  const hasRunning = campaigns.some((c) => c.status === 'running')
  useEffect(() => {
    if (!visible || !hasRunning) return
    const timer = setInterval(() => void load(), 2000)
    return () => clearInterval(timer)
  }, [visible, hasRunning, load])

  const insertVar = (v: string) => {
    const el = templateRef.current
    if (!el) {
      setTemplate((prev) => prev + v)
      return
    }
    const start = el.selectionStart ?? template.length
    const end = el.selectionEnd ?? template.length
    setTemplate(template.slice(0, start) + v + template.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + v.length, start + v.length)
    })
  }

  const generateWithAi = async () => {
    setAiLoading(true)
    try {
      const res = await apiFetch('/api/campaigns/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          niche: name.trim() === '' ? 'negócios locais' : name,
          location: stage,
          language,
        }),
      })
      const data = (await res.json()) as { templates?: string[]; error?: string }
      if (!res.ok || !data.templates?.length) throw new Error(data.error ?? t('common.error'))
      setTemplate(data.templates[0] ?? '')
      toast.success(`${t('camp.ai')} ✓`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setAiLoading(false)
    }
  }

  const create = async () => {
    setCreating(true)
    try {
      const res = await apiFetch('/api/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, template, stage }),
      })
      const data = (await res.json()) as { id?: string; error?: string; total?: number }
      if (!res.ok) throw new Error(data.error ?? t('common.error'))
      toast.success(`${t('camp.created')} · ${data.total}`)
      setName('')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  const preview = (template || '…')
    .replaceAll('{{nome}}', 'Ana')
    .replaceAll('{{empresa}}', 'Clínica Exemplo')
    .replaceAll('{{cidade}}', 'São Paulo')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
      {/* -------- Form -------- */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-emerald-500" aria-hidden="true" />
          <h1 className="text-lg font-bold text-zinc-900">{t('camp.title')}</h1>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{t('camp.subtitle')}</p>

        <div className="mt-4 space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold text-zinc-700">{t('camp.name')}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('camp.name.ph')} className="h-10 rounded-xl" />
          </label>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-zinc-700">{t('camp.template')}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void generateWithAi()}
                disabled={aiLoading}
                className="h-7 rounded-full px-3 text-[12px]"
              >
                <Sparkles className={`mr-1 size-3.5 ${aiLoading ? 'animate-pulse text-primary' : 'text-primary'}`} aria-hidden="true" />
                {aiLoading ? t('camp.ai.loading') : t('camp.ai')}
              </Button>
            </div>
            <Textarea
              ref={templateRef}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              maxLength={600}
              className="rounded-xl text-[13.5px]"
              placeholder='Olá, {{empresa}}! Vi que vocês atendem em {{cidade}}…'
            />
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[11.5px] text-zinc-500">{t('camp.insertVar')}</span>
              {['{{nome}}', '{{empresa}}', '{{cidade}}'].map((v) => (
                <button
                  key={v}
                  onClick={() => insertVar(v)}
                  className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600 transition-colors hover:bg-zinc-200"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold text-zinc-700">{t('camp.stage')}</span>
            <Select value={stage} onValueChange={(v) => setStage(v as KanbanStage)}>
              <SelectTrigger className="h-10 w-full rounded-xl">
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
          </Label>

          {/* Prévia */}
          <div className="rounded-xl bg-emerald-950 p-3.5">
            <p className="text-[11px] font-semibold tracking-wide text-emerald-400 uppercase">{t('camp.preview')}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed break-words text-emerald-50">{preview}</p>
          </div>

          <Button
            onClick={() => void create()}
            disabled={creating || template.trim().length < 10 || name.trim().length < 2}
            className="h-10 w-full rounded-xl bg-emerald-600 font-semibold shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
          >
            <Send className="mr-1.5 size-4" aria-hidden="true" />
            {creating ? t('common.loading') : t('camp.create')}
          </Button>
        </div>
      </div>

      {/* -------- Lista -------- */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-[14px] text-zinc-500">
            {t('camp.empty')}
          </div>
        ) : (
          campaigns.map((camp) => (
            <article key={camp.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-bold text-zinc-900">{camp.name}</h2>
                <Badge variant="outline" className="rounded-full bg-zinc-50 text-[11px] font-semibold text-zinc-600">
                  {t(STAGE_LABEL_KEY[camp.stage as KanbanStage] ?? 'stage.new')}
                </Badge>
                <span className="ml-auto">
                  {camp.status === 'running' ? (
                    <Badge className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                      <Clock className="mr-1 size-3.5" aria-hidden="true" />
                      {t('camp.running')}
                    </Badge>
                  ) : (
                    <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                      <CircleCheck className="mr-1 size-3.5" aria-hidden="true" />
                      {t('camp.done')}
                    </Badge>
                  )}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <CampStat icon={Send} label={t('camp.stats.sent')} value={camp.sent} total={camp.total} color="bg-sky-500" />
                <CampStat icon={Users} label={t('camp.stats.delivered')} value={camp.delivered} total={camp.total} color="bg-emerald-500" />
                <CampStat icon={TrendingUp} label={t('camp.stats.replied')} value={camp.replied} total={camp.total} color="bg-primary" />
              </div>

              {/* Mensagens */}
              <ul className="mt-4 max-h-56 space-y-1.5 overflow-y-auto border-t border-zinc-100 pt-3 scrollbar-slim">
                {camp.messages.slice(0, 30).map((msg) => (
                  <li key={msg.id} className="flex items-center gap-2 text-[12.5px]">
                    <MsgStatusIcon status={msg.status} />
                    <span className="truncate font-medium text-zinc-700">{msg.leadName}</span>
                    <span className="ml-auto shrink-0 text-[11px] font-semibold text-zinc-400">{msg.status}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

function CampStat({
  icon: Icon,
  label,
  value,
  total,
  color,
}: {
  icon: typeof Send
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-600">
        <Icon className="size-3.5 text-zinc-400" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums text-zinc-900">
        {value}
        <span className="ml-1 text-[11px] font-semibold text-zinc-400">/ {total}</span>
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MsgStatusIcon({ status }: { status: string }) {
  if (status === 'replied') return <CheckCheck className="size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
  if (status === 'delivered') return <CircleCheck className="size-3.5 shrink-0 text-sky-500" aria-hidden="true" />
  if (status === 'failed') return <CircleX className="size-3.5 shrink-0 text-red-400" aria-hidden="true" />
  return <Clock className="size-3.5 shrink-0 text-zinc-300" aria-hidden="true" />
}
