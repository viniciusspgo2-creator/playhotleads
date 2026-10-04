// src/components/landing/pipeline.tsx
// Seção "Gestão": preview do Kanban de leads + painel de campanhas de WhatsApp.
// Server component — visual estático.

import { MessageCircle, Send, TrendingUp, Users, GripVertical, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type KanbanCard = {
  name: string
  tag?: string
  highlight?: boolean
}

const KANBAN: { stage: string; count: number; cards: KanbanCard[] }[] = [
  {
    stage: 'Novo',
    count: 14,
    cards: [
      { name: 'Odonto Prime', tag: '★4.8', highlight: true },
      { name: 'Sorriso Perfeito JK' },
      { name: 'OdontoVida Paulista' },
    ],
  },
  {
    stage: 'Contatado',
    count: 6,
    cards: [
      { name: 'Dra. Beatriz Lins', tag: 'resp. 2h' },
      { name: 'Dental Excelência' },
    ],
  },
  {
    stage: 'Negociação',
    count: 3,
    cards: [
      { name: 'Clínica Bem Estar', tag: 'proposta', highlight: true },
      { name: 'OdontoKids Paulista' },
    ],
  },
  {
    stage: 'Ganho',
    count: 1,
    cards: [{ name: 'Sorrir+ Odontologia', tag: 'fechado ✓' }],
  },
]

const WHATS_STATS = [
  { icon: Send, label: 'Mensagens enviadas', value: '120', pct: 100, color: 'bg-sky-500' },
  { icon: Users, label: 'Entregues', value: '117', pct: 97, color: 'bg-emerald-500' },
  { icon: TrendingUp, label: 'Respondidas', value: '38 (32%)', pct: 32, color: 'bg-primary' },
] as const

export function Pipeline() {
  return (
    <section id="gestao" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
            Do lead ao cliente
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Captação é só o começo
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-600">
            Todo lead que entra já cai no Kanban. Dali, você empurra pra campanha de
            WhatsApp e acompanha a conversão — dentro da mesma tela.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* -------- Preview do Kanban -------- */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-xl shadow-zinc-950/5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {KANBAN.map((col, ci) => (
                <div key={col.stage} className="min-w-0">
                  <div className="mb-2.5 flex items-center justify-between gap-1.5">
                    <span className="truncate text-[12.5px] font-bold text-zinc-700">
                      {col.stage}
                    </span>
                    <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10.5px] font-bold text-zinc-600">
                      {col.count}
                    </span>
                  </div>
                  <ul className="space-y-2 rounded-xl bg-zinc-100/70 p-2 min-h-28">
                    {col.cards.map((card) => (
                      <li
                        key={card.name}
                        className={`rounded-lg border px-2.5 py-2 shadow-sm ${
                          card.highlight
                            ? 'border-orange-200 bg-white ring-1 ring-orange-100'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <GripVertical
                            className="size-3 shrink-0 text-zinc-300"
                            aria-hidden="true"
                          />
                          <p className="truncate text-[12px] font-semibold text-zinc-800">
                            {card.name}
                          </p>
                        </div>
                        {card.tag && (
                          <p
                            className={`mt-1 pl-4.5 text-[10.5px] font-medium ${
                              ci === 3 ? 'text-emerald-600' : 'text-zinc-500'
                            }`}
                          >
                            {card.tag}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[12px] text-zinc-500">
              Arraste e solte · histórico por lead · notas internas
            </p>
          </div>

          {/* -------- Painel de campanha WhatsApp -------- */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-950/5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-zinc-900">
                <MessageCircle className="size-4.5 text-emerald-500" aria-hidden="true" />
                Campanha WhatsApp
              </h3>
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
              >
                ativa
              </Badge>
            </div>

            {/* Template da mensagem */}
            <div className="mt-4 rounded-xl bg-emerald-950 p-4">
              <p className="text-[12.5px] leading-relaxed text-emerald-100">
                Olá <span className="rounded bg-emerald-800/80 px-1 font-mono text-[11.5px]">{'{{nome}}'}</span>
                ! Vi que a <span className="rounded bg-emerald-800/80 px-1 font-mono text-[11.5px]">{'{{empresa}}'}</span>{' '}
                tem avaliações ótimas em SP. Ajudamos clínicas a encher a agenda com novos
                pacientes — te interessa uma previsão gratuita de 15 min?
              </p>
              <div className="mt-2 flex items-center justify-end text-[10px] text-emerald-400/70">
                <Clock className="mr-1 size-3" aria-hidden="true" />14:32 ✓✓
              </div>
            </div>

            {/* Stats da campanha */}
            <ul className="mt-5 space-y-3.5">
              {WHATS_STATS.map(({ icon: Icon, label, value, pct, color }) => (
                <li key={label}>
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="flex items-center gap-1.5 font-medium text-zinc-600">
                      <Icon className="size-3.5 text-zinc-400" aria-hidden="true" />
                      {label}
                    </span>
                    <span className="font-bold tabular-nums text-zinc-900">{value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[12.5px] leading-relaxed text-zinc-500">
              Segmentação por etapa do Kanban, variáveis no template e taxa de resposta
              por campanha — o ciclo completo de prospecção.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
