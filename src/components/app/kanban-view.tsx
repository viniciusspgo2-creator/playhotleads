'use client'

// src/components/app/kanban-view.tsx
// Kanban com drag & drop real (@dnd-kit): mover card persiste PATCH na hora.
// Colunas: Novo / Contatado / Negociação / Ganho / Perdido.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { GripVertical, LayoutGrid, Building2, Star, Info } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/tenant-client'
import { useI18n } from './i18n'
import { LeadDetail } from './lead-detail'
import type { KanbanStage, LeadDTO } from '@/core/types'
import { KANBAN_STAGES } from '@/core/types'

const STAGE_ACCENT: Record<KanbanStage, string> = {
  new: 'bg-sky-500',
  contacted: 'bg-amber-500',
  negotiation: 'bg-orange-500',
  won: 'bg-emerald-500',
  lost: 'bg-zinc-400',
}

const STAGE_LABEL_KEY: Record<KanbanStage, string> = {
  new: 'stage.new',
  contacted: 'stage.contacted',
  negotiation: 'stage.negotiation',
  won: 'stage.won',
  lost: 'stage.lost',
}

export function KanbanView({ visible }: { visible: boolean }) {
  const { t } = useI18n()
  const [leads, setLeads] = useState<LeadDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<LeadDTO | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/leads?pageSize=100')
      if (!res.ok) return
      const data = (await res.json()) as { leads: LeadDTO[] }
      setLeads(data.leads)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (visible) void load()
  }, [visible, load])

  const byStage = useMemo(() => {
    const map = new Map<KanbanStage, LeadDTO[]>()
    for (const stage of KANBAN_STAGES) map.set(stage, [])
    for (const lead of leads) map.get(lead.kanbanStage)?.push(lead)
    return map
  }, [leads])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const leadId = String(event.active.id)
      const overId = event.over?.id
      if (!overId) return
      const stage = String(overId) as KanbanStage
      if (!KANBAN_STAGES.includes(stage)) return

      const lead = leads.find((l) => l.id === leadId)
      if (!lead || lead.kanbanStage === stage) return

      // otimista
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, kanbanStage: stage } : l)))

      try {
        const res = await apiFetch(`/api/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ kanbanStage: stage }),
        })
        if (!res.ok) throw new Error('falha ao mover')
      } catch {
        // rollback
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, kanbanStage: lead.kanbanStage } : l)))
        toast.error(t('common.error'))
      }
    },
    [leads, t],
  )

  const onLeadSaved = useCallback((saved: LeadDTO) => {
    setLeads((prev) => prev.map((l) => (l.id === saved.id ? saved : l)))
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <LayoutGrid className="size-5 text-primary" aria-hidden="true" />
        <h1 className="text-lg font-bold text-zinc-900">{t('tabs.kanban')}</h1>
        <p className="hidden items-center gap-1 text-[12.5px] text-zinc-500 sm:flex">
          <Info className="size-3.5" aria-hidden="true" />
          {t('kanban.hint')}
        </p>
      </div>

      {loading ? (
        <div className="grid h-64 place-items-center text-zinc-500">{t('common.loading')}…</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e) => void handleDragEnd(e)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {KANBAN_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={byStage.get(stage) ?? []}
                onOpen={setDetail}
              />
            ))}
          </div>
        </DndContext>
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

/* ------------------------------------------------------------------ */

function KanbanColumn({
  stage,
  leads,
  onOpen,
}: {
  stage: KanbanStage
  leads: LeadDTO[]
  onOpen: (lead: LeadDTO) => void
}) {
  const { t } = useI18n()
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <section
      ref={setNodeRef}
      aria-label={t(STAGE_LABEL_KEY[stage])}
      className={`flex min-h-64 flex-col rounded-2xl border p-2.5 transition-colors ${
        isOver ? 'border-orange-300 bg-orange-50/60' : 'border-zinc-200 bg-zinc-100/70'
      }`}
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        <span className={`size-2 rounded-full ${STAGE_ACCENT[stage]}`} aria-hidden="true" />
        <h2 className="text-[13px] font-bold text-zinc-700">{t(STAGE_LABEL_KEY[stage])}</h2>
        <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-zinc-500 shadow-sm">
          {leads.length}
        </span>
      </header>

      <ul className="flex flex-1 flex-col gap-2">
        {leads.length === 0 && (
          <li className="rounded-xl border border-dashed border-zinc-300 px-3 py-4 text-center text-[12px] text-zinc-400">
            {t('kanban.empty')}
          </li>
        )}
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  )
}

function KanbanCard({ lead, onOpen }: { lead: LeadDTO; onOpen: (lead: LeadDTO) => void }) {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white p-2.5 shadow-sm transition-shadow ${
        isDragging ? 'z-10 rotate-1 opacity-80 shadow-xl' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          aria-label={`mover ${lead.name}`}
          className="mt-0.5 cursor-grab touch-none rounded text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <button onClick={() => onOpen(lead)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-[13px] font-bold text-zinc-800">{lead.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {lead.whatsapp && (
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                {t('leads.whatsapp')}
              </span>
            )}
            {lead.email && (
              <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">✉</span>
            )}
            {lead.rating !== null && (
              <span className="flex items-center gap-0.5 text-[10.5px] font-bold text-amber-500">
                <Star className="size-3 fill-amber-400" aria-hidden="true" />
                {lead.rating.toFixed(1)}
              </span>
            )}
            {lead.sources.length > 1 && (
              <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                {lead.sources.length} fontes
              </span>
            )}
          </div>
        </button>
        <span className="mt-0.5 text-zinc-300">
          <Building2 className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </li>
  )
}
