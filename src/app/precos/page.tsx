// src/app/precos/page.tsx
// Página pública de planos — fonte viva: os planos vêm do banco (editáveis no
// painel master) com try/catch + fallback editorial (FALLBACK_PLANS) para o
// build nunca quebrar com banco vazio (regra do deploy Vercel/Neon).
// ISR 10 min: o master edita o plano e a página reflete em minutos.
// JSON-LD: Service + Offers reais + FAQPage + Breadcrumb.

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Breadcrumbs, breadcrumbLd } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo'
import { FALLBACK_PLANS, SITE, type PublicPlan } from '@/content/site-config'
import { db } from '@/lib/db'

export const revalidate = 600

export const metadata: Metadata = buildPageMetadata({
  path: '/precos',
  title: 'Planos e créditos — comece com 150 leads grátis',
  description:
    'Plano gratuito com 150 créditos (1 crédito = 1 lead único) e planos pagos a partir de R$ 97/mês. Pix, Mercado Pago, cartão e Asaas, sem fidelidade.',
  keywords: [
    'preços gerador de leads',
    'planos play hot leads',
    'leads grátis',
    'comprar leads b2b brasil',
  ],
})

const PRICING_FAQ = [
  {
    q: 'O plano gratuito é realmente grátis?',
    a: 'Sim. O cadastro cria a conta com 150 créditos grátis, sem cartão de crédito. Cada lead único entregue consome 1 crédito, e leads duplicados (já existentes na sua conta) não consomem crédito.',
  },
  {
    q: 'Como funcionam os créditos?',
    a: '1 crédito = 1 lead único entregue na sua conta. Você define o limite da busca; se a busca retornar 55 leads únicos, são 55 créditos. Créditos dos planos pagos são adicionados após a confirmação do pagamento.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Pix, Mercado Pago, cartão de crédito e Asaas. A confirmação via Pix costuma ser imediata; os créditos são liberados automaticamente quando o gateway confirma o pagamento.',
  },
  {
    q: 'Existe fidelidade ou multa de cancelamento?',
    a: 'Não. Os planos pagos são mensais e você pode parar de renovar quando quiser — os créditos já liberados continuam disponíveis na sua conta.',
  },
]

/** Plano do banco → shape editorial. Seguro contra features malformadas. */
function toPublicPlan(name: string, raw: {
  priceCents: number
  credits: number
  features: string
  description?: string
  highlight: boolean
}): PublicPlan {
  let features: string[] = []
  try {
    const parsed: unknown = JSON.parse(raw.features)
    if (Array.isArray(parsed)) features = parsed.filter((f): f is string => typeof f === 'string')
  } catch {
    features = []
  }
  return {
    name,
    priceCents: raw.priceCents,
    period: raw.priceCents === 0 ? 'para sempre' : 'mensal',
    description:
      raw.description ??
      (raw.credits > 0
        ? `${raw.credits.toLocaleString('pt-BR')} créditos por ciclo.`
        : 'Créditos avulsos conforme contratação.'),
    features,
    highlight: raw.highlight,
  }
}

async function loadPlans(): Promise<{ plans: PublicPlan[]; source: 'db' | 'fallback' }> {
  try {
    const rows = await db.plan.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { priceCents: 'asc' }],
    })
    if (rows.length === 0) return { plans: FALLBACK_PLANS, source: 'fallback' }
    const plans = rows.map((p) =>
      toPublicPlan(p.name, {
        priceCents: p.priceCents,
        credits: p.credits,
        features: p.features,
        highlight: p.highlight,
      }),
    )
    return { plans, source: 'db' }
  } catch {
    // Banco vazio/indisponível (1º deploy) — snapshot editorial garante a página.
    return { plans: FALLBACK_PLANS, source: 'fallback' }
  }
}

function formatPrice(priceCents: number): string {
  if (priceCents === 0) return 'R$ 0'
  return (priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  })
}

export default async function PrecosPage() {
  const { plans, source } = await loadPlans()

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Play Hot Leads — Geração de leads B2B',
    serviceType: 'Geração de leads / prospecção ativa',
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    areaServed: SITE.contact.areaServed.map((c) => ({ '@type': 'Country', name: c })),
    description: SITE.shortDescription,
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.description,
      price: (plan.priceCents / 100).toFixed(2),
      priceCurrency: 'BRL',
      url: `${SITE.url}/precos`,
      availability: 'https://schema.org/InStock',
      ...(plan.features.length > 0
        ? { itemOffered: { '@type': 'Service', name: `Plano ${plan.name}`, description: plan.features.join(' · ') } }
        : {}),
    })),
  }

  const faqPageLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE.url}/precos`,
    inLanguage: SITE.locale,
    mainEntity: PRICING_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Planos' }]} />

        <header className="mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Planos e créditos
          </h1>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-zinc-600">
            Você paga por lead único entregue — não por busca feita. Comece com{' '}
            <strong className="font-semibold text-zinc-900">
              150 créditos grátis
            </strong>{' '}
            (1 crédito = 1 lead único), sem cartão de crédito, e escale quando
            fizer sentido. Pagamento via Pix, Mercado Pago, cartão ou Asaas.
          </p>
        </header>

        {/* Cards de planos */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.name}
              aria-label={`Plano ${plan.name}`}
              className={`flex flex-col rounded-3xl border p-6 ${
                plan.highlight
                  ? 'border-orange-300 bg-orange-50/50 shadow-lg shadow-orange-600/10 ring-1 ring-orange-200'
                  : 'border-zinc-200 bg-white shadow-sm'
              }`}
            >
              {plan.highlight && (
                <span className="mb-3 w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-wide text-primary-foreground uppercase">
                  Mais escolhido
                </span>
              )}
              <h2 className="text-lg font-bold text-zinc-950">{plan.name}</h2>
              <p className="mt-1 min-h-10 text-[13.5px] leading-snug text-zinc-600">
                {plan.description}
              </p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-zinc-950">
                  {formatPrice(plan.priceCents)}
                </span>
                <span className="text-[13px] font-medium text-zinc-500">
                  {plan.period === 'mensal' ? '/mês' : plan.period}
                </span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-[14px] leading-snug text-zinc-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/#/app"
                data-cta={`precos-open-app-${plan.name.toLowerCase()}`}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-transform hover:scale-[1.02] ${
                  plan.highlight
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-orange-600/25'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:border-orange-200 hover:text-primary'
                }`}
              >
                {plan.priceCents === 0 ? 'Começar grátis' : `Assinar ${plan.name}`}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </section>
          ))}
        </div>

        {/* Tabela comparativa — GEO (HTML table parseável por LLMs) */}
        <section aria-labelledby="comparativo" className="mt-14">
          <h2 id="comparativo" className="text-2xl font-bold tracking-tight text-zinc-950">
            Comparativo rápido dos planos
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <caption className="sr-only">
                Comparação de preço, créditos e recursos entre os planos do Play Hot Leads
              </caption>
              <thead className="bg-zinc-50 text-[12.5px] tracking-wide text-zinc-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Plano</th>
                  <th scope="col" className="px-4 py-3 font-bold">Preço</th>
                  <th scope="col" className="px-4 py-3 font-bold">Modelo</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ideal para</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {plans.map((plan) => (
                  <tr key={plan.name} className="bg-white">
                    <th scope="row" className="px-4 py-3.5 font-bold text-zinc-950">{plan.name}</th>
                    <td className="px-4 py-3.5 text-zinc-700">
                      {formatPrice(plan.priceCents)}
                      {plan.period === 'mensal' ? '/mês' : ''}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700">
                      1 crédito = 1 lead único; {plan.period}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700">{plan.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] text-zinc-500">
            {source === 'db'
              ? 'Valores atuais, sincronizados do painel administrativo.'
              : 'Valores de referência — os planos ativos ficam visíveis também dentro do app, na aba Planos.'}
          </p>
        </section>

        {/* FAQ de preços */}
        <section aria-labelledby="precos-faq" className="mt-14">
          <h2 id="precos-faq" className="text-2xl font-bold tracking-tight text-zinc-950">
            Perguntas sobre preços e créditos
          </h2>
          <div className="mt-4 space-y-3">
            {PRICING_FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-zinc-200 bg-white p-4 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-zinc-900 marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-2.5 text-[14px] leading-relaxed text-zinc-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-label="Próximos passos" className="mt-12 rounded-2xl border border-orange-200 bg-orange-50/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950">
            Primeira busca com créditos grátis
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
            Crie a conta, informe nicho + cidade e veja os cards chegarem em
            tempo real. Dúvidas? Consulte a{' '}
            <Link href="/faq" className="font-semibold text-primary underline-offset-2 hover:underline">
              FAQ completa
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/#/app"
              data-cta="precos-open-app"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-orange-600/25 transition-transform hover:scale-[1.03]"
            >
              Criar conta grátis
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/blog/o-que-e-lead-generacao"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-zinc-700 transition-colors hover:border-orange-200 hover:text-primary"
            >
              O que é geração de leads
            </Link>
          </div>
        </section>
      </div>

      <JsonLd data={[serviceLd, faqPageLd, breadcrumbLd([
        { label: 'Início', href: `${SITE.url}/` },
        { label: 'Planos', href: `${SITE.url}/precos` },
      ])]} />
    </div>
  )
}
