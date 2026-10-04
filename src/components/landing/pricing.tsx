// src/components/landing/pricing.tsx
// Seção de preços: 3 planos, destaque no Pro. Server component.

import { Check, X, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Plan = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  missing: string[]
  cta: string
  highlight: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: 'R$ 0',
    period: 'para sempre',
    description: 'Pra testar o motor e validar o seu nicho.',
    features: [
      '50 leads por mês',
      '2 fontes (Google Places + Yelp)',
      'Cards em tempo real',
      'Dedup automático',
      '1 usuário',
    ],
    missing: ['Enriquecimento por crawl', 'Campanhas de WhatsApp', 'Kanban completo'],
    cta: 'Criar conta grátis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'R$ 97',
    period: 'por mês',
    description: 'Pra quem faz prospecção todos os dias.',
    features: [
      '5.000 leads por mês',
      'Todas as fontes + toggles',
      'Enriquecimento por crawl do site',
      'Campanhas de WhatsApp',
      'Kanban completo + notas',
      'Traga suas próprias API keys',
      '3 usuários',
    ],
    missing: [],
    cta: 'Assinar o Pro',
    highlight: true,
  },
  {
    name: 'Scale',
    price: 'R$ 297',
    period: 'por mês',
    description: 'Pra agências e times de vendas.',
    features: [
      'Leads ilimitados',
      'Usuários ilimitados',
      'Proxy residencial gerenciado',
      'Fila prioritária nos workers',
      'API própria + webhooks',
      'Suporte prioritário',
    ],
    missing: [],
    cta: 'Falar com vendas',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="precos" className="scroll-mt-20 bg-zinc-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
            Preços
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Comece grátis. Escale quando fizer sentido.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-600">
            Sem cartão de crédito pra começar. Cancele quando quiser. As suas chaves de
            API ficam sempre com você.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex h-full flex-col rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? 'border-2 border-primary bg-white shadow-2xl shadow-orange-600/15 md:scale-[1.04]'
                  : 'border border-zinc-200 bg-white shadow-sm'
              }`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 gap-1 rounded-full px-3.5 py-1 font-bold shadow-lg shadow-orange-600/30">
                  <Flame className="size-3.5" aria-hidden="true" />
                  Mais popular
                </Badge>
              )}

              <h3 className="text-[15px] font-bold text-zinc-900">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span
                  className={`text-4xl font-extrabold tracking-tight ${
                    plan.highlight ? 'text-primary' : 'text-zinc-950'
                  }`}
                >
                  {plan.price}
                </span>
                <span className="text-[13px] font-medium text-zinc-500">{plan.period}</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-600">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-zinc-700">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-500"
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[13.5px] text-zinc-400 line-through"
                  >
                    <X className="mt-0.5 size-4 shrink-0 text-zinc-300" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={plan.highlight ? 'default' : 'outline'}
                className={`mt-7 w-full rounded-xl font-semibold ${
                  plan.highlight ? 'shadow-lg shadow-orange-600/30' : ''
                }`}
              >
                <a href="#/app" data-cta={`pricing-${plan.name.toLowerCase()}`}>{plan.cta}</a>
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-zinc-500">
          Custo das APIs de terceiros (Google Places, SerpAPI) não incluso — você conecta
          as suas chaves e controla o gasto.
        </p>
      </div>
    </section>
  )
}
