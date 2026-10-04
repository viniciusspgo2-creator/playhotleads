// src/components/landing/features.tsx
// Grid de funcionalidades + seção "Como funciona" (3 passos).
// Server component — sem interatividade, só apresentação.

import {
  Layers,
  Zap,
  Fingerprint,
  Phone,
  Globe,
  ShieldCheck,
  ListTodo,
  MessageCircle,
  Search,
  Rocket,
  LayoutGrid,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const FEATURES = [
  {
    icon: Layers,
    title: 'Orquestração paralela',
    body: 'Todas as fontes disparam ao mesmo tempo. A primeira resposta chega em ~1 segundo; as outras vão somando.',
  },
  {
    icon: Zap,
    title: 'Cards em tempo real',
    body: 'Via SSE, cada lead pinga na tela conforme o worker entrega — nada de esperar a busca inteira terminar.',
  },
  {
    icon: Fingerprint,
    title: 'Dedup automático',
    body: 'Hash de phone + domínio + nome normalizado, com constraint UNIQUE no banco. Lead repetido simplesmente não entra.',
  },
  {
    icon: Phone,
    title: 'Telefone E.164 + WhatsApp',
    body: 'Normalização internacional (libphonenumber) e detecção de WhatsApp — pronto pra campanha, sem gambiarra.',
  },
  {
    icon: Globe,
    title: 'Enriquecimento por crawl',
    body: 'Lead com site mas sem e-mail? Nosso crawler visita a página e acha o contato que ninguém mais publica.',
  },
  {
    icon: ShieldCheck,
    title: 'Isolamento de falhas',
    body: 'Provider bloqueado ou fora do ar é isolado com retry e backoff. A sua busca nunca cai por causa de um.',
  },
  {
    icon: ListTodo,
    title: 'Kanban de gestão',
    body: 'Arraste leads entre Novo, Contatado, Negociação e Ganho. Status de contato, notas e histórico por card.',
  },
  {
    icon: MessageCircle,
    title: 'Campanhas de WhatsApp',
    body: 'Templates com variáveis, disparo segmentado por etapa do Kanban e taxa de resposta acompanhada.',
  },
] as const

const STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Digite nicho, localização e país',
    body: '“Clínicas odontológicas em São Paulo, BR”. Troque de país e as fontes certas entram no jogo automaticamente.',
  },
  {
    icon: Rocket,
    step: '02',
    title: 'O motor dispara todas as fontes',
    body: 'Fila com workers dedicados roda o scraping pesado fora do seu request — API paga, scrapers free e crawl em paralelo.',
  },
  {
    icon: LayoutGrid,
    step: '03',
    title: 'Cards pingam na tela. Só fechar.',
    body: 'Dedup e enriquecimento acontecem no meio do caminho. Você vê o lead pronto e o manda pro Kanban ou pro WhatsApp.',
  },
] as const

export function Features() {
  return (
    <>
      {/* ---------- Funcionalidades ---------- */}
      <section id="funcionalidades" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
              Funcionalidades
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Tudo que a captação precisa, num só fluxo
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-600">
              Da busca bruta na web até o primeiro contato no WhatsApp — sem planilhas,
              sem copiar-e-colar, sem lead repetido.
            </p>
          </div>

          <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-600/5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-zinc-900">{title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section id="como-funciona" className="scroll-mt-20 bg-zinc-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
              Como funciona
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Três passos entre você e o pipeline cheio
            </h2>
          </div>

          <ol className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {/* Linha conectora (desktop) */}
            <div
              className="absolute top-7 right-[16%] left-[16%] hidden border-t-2 border-dashed border-zinc-300 md:block"
              aria-hidden="true"
            />
            {STEPS.map(({ icon: Icon, step, title, body }) => (
              <li key={step} className="relative">
                <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-600/25">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-3xl font-bold text-zinc-200">{step}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-zinc-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex justify-center">
            <Badge
              variant="outline"
              className="max-w-full rounded-full border-sky-200 bg-sky-50 px-4 py-1.5 text-center text-[13px] font-medium leading-snug text-sky-700 whitespace-normal"
            >
              Scraping pesado roda em workers na fila — nunca dentro do request da sua busca.
            </Badge>
          </div>
        </div>
      </section>
    </>
  )
}
