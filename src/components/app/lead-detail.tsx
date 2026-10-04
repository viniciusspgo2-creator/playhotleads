'use client'

// src/components/app/lead-detail.tsx
// Dialog de detalhes: dados completos, wa.me real, cópia, estágio, nota e
// status de contato — PATCH persiste na hora.

import { useEffect, useState } from 'react'
import {
  Star,
  Phone,
  Mail,
  Globe,
  MapPin,
  MessageCircle,
  Copy,
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/tenant-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from './i18n'
import type { KanbanStage, LeadDTO } from '@/core/types'
import { KANBAN_STAGES } from '@/core/types'

const STAGE_LABEL_KEY: Record<KanbanStage, string> = {
  new: 'stage.new',
  contacted: 'stage.contacted',
  negotiation: 'stage.negotiation',
  won: 'stage.won',
  lost: 'stage.lost',
}

export function LeadDetail({
  lead,
  open,
  onOpenChange,
  onSaved,
}: {
  lead: LeadDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (lead: LeadDTO) => void
}) {
  const { t } = useI18n()
  const [stage, setStage] = useState<KanbanStage>('new')
  const [note, setNote] = useState('')
  const [contactStatus, setContactStatus] = useState<string>('none')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (lead) {
      setStage(lead.kanbanStage)
      setNote(lead.note ?? '')
      setContactStatus(lead.contactStatus ?? 'none')
    }
  }, [lead])

  if (!lead) return null

  const copy = async (value: string, labelKey: string) => {
    await navigator.clipboard.writeText(value).catch(() => undefined)
    toast.success(`${t(labelKey)} · ${t('leads.copied')}`)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await apiFetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kanbanStage: stage,
          note: note.trim() === '' ? null : note.trim(),
          contactStatus: contactStatus === 'none' ? null : contactStatus,
        }),
      })
      if (!res.ok) throw new Error('falha ao salvar')
      const data = (await res.json()) as { lead: LeadDTO }
      onSaved(data.lead)
      toast.success(t('kanban.saved'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const waBody = encodeURIComponent(
    `Olá, ${lead.name.split(' ')[0]}! Tudo bem? Passando pra conversar sobre o seu negócio.`,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-left">
            <span className="truncate">{lead.name}</span>
            {lead.rating !== null && (
              <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-bold text-amber-500">
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {lead.rating.toFixed(1)}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1.5">
            {lead.sources.map((s) => (
              <Badge key={s} variant="outline" className="rounded-md bg-zinc-50 text-[10.5px] font-medium text-zinc-600">
                {s}
              </Badge>
            ))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 text-[13.5px]">
          {lead.phone && (
            <div className="flex items-center gap-2 text-zinc-700">
              <Phone className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="truncate">{lead.phone}</span>
              <button
                onClick={() => void copy(lead.phone ?? '', 'leads.copy.phone')}
                aria-label={t('leads.copy.phone')}
                className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <Copy className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-zinc-700">
              <Mail className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="truncate">{lead.email}</span>
              <button
                onClick={() => void copy(lead.email ?? '', 'leads.copy.email')}
                aria-label={t('leads.copy.email')}
                className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <Copy className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sky-600 hover:underline"
            >
              <Globe className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
              <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
            </a>
          )}
          {lead.address && (
            <p className="flex items-center gap-2 text-zinc-600">
              <MapPin className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="truncate">{lead.address}</span>
            </p>
          )}
          {(lead.socials.instagram || lead.socials.facebook || lead.socials.linkedin) && (
            <div className="flex items-center gap-3 pt-1 text-zinc-500">
              {lead.socials.instagram && (
                <a href={lead.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-primary">
                  <Instagram className="size-4" aria-hidden="true" />
                </a>
              )}
              {lead.socials.facebook && (
                <a href={lead.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-primary">
                  <Facebook className="size-4" aria-hidden="true" />
                </a>
              )}
              {lead.socials.linkedin && (
                <a href={lead.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-primary">
                  <Linkedin className="size-4" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>

        {lead.whatsapp && lead.phoneE164 ? (
          <Button asChild className="w-full rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700">
            <a
              href={`https://wa.me/${lead.phoneE164.replace(/\D/g, '')}?text=${waBody}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-1.5 size-4" aria-hidden="true" />
              {t('kanban.wame')}
            </a>
          </Button>
        ) : (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-[12px] text-zinc-500">
            {t('kanban.noWhats')}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('kanban.stage')}</span>
            <Select value={stage} onValueChange={(v) => setStage(v as KanbanStage)}>
              <SelectTrigger className="h-9 w-full rounded-lg text-[13px]">
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
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('kanban.contact')}</span>
            <Select value={contactStatus} onValueChange={setContactStatus}>
              <SelectTrigger className="h-9 w-full rounded-lg text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="ok">{t('kanban.contact.ok')}</SelectItem>
                <SelectItem value="waiting">{t('kanban.contact.waiting')}</SelectItem>
                <SelectItem value="not_interested">{t('kanban.contact.not_interested')}</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('kanban.note')}</span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('kanban.note.ph')}
            rows={2}
            className="rounded-xl text-[13px]"
            maxLength={500}
          />
        </label>

        <Button onClick={() => void save()} disabled={saving} className="w-full rounded-xl font-semibold">
          {t('kanban.save')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
