// src/app/faq/page.tsx
// FAQ institucional completo — JSON-LD FAQPage derivado do MESMO dataset
// (src/content/faq.ts) usado na página. details/summary nativo = conteúdo
// inteiro no HTML inicial (rastreável por Google e por LLMs).

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs, breadcrumbLd } from '@/components/seo/breadcrumbs'
import { FaqDetails } from '@/components/seo/article-renderer'
import { buildPageMetadata } from '@/lib/seo'
import { FAQ_ITEMS } from '@/content/faq'
import { SITE } from '@/content/site-config'

export const metadata: Metadata = buildPageMetadata({
  path: '/faq',
  title: 'Perguntas frequentes — Play Hot Leads',
  description:
    'Como funciona a busca de leads, créditos (150 grátis no cadastro), fontes de dados, países suportados, WhatsApp, isolamento de dados, pagamentos via Pix/Mercado Pago/cartão/Asaas e suporte.',
  keywords: [
    'play hot leads faq',
    'como funciona gerador de leads',
    'créditos de leads',
    'formas de pagamento saas',
  ],
})

export default function FaqPage() {
  const faqPageLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE.url}/faq`,
    inLanguage: SITE.locale,
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'FAQ' }]} />

        <header className="mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Perguntas frequentes
          </h1>
          <p className="mt-4 text-[16.5px] leading-relaxed text-zinc-600">
            Respostas diretas sobre o produto, créditos, fontes de dados e
            pagamentos. Faltou algo? Fale com a gente pelo e-mail{' '}
            <a
              href={`mailto:${SITE.contact.email}`}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              {SITE.contact.email}
            </a>
            .
          </p>
        </header>

        <div className="mt-10">
          <FaqDetails items={FAQ_ITEMS} />
        </div>

        <section aria-label="Próximos passos" className="mt-12 rounded-2xl border border-orange-200 bg-orange-50/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950">
            Pronto para ver o motor funcionando?
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
            O cadastro dá 150 créditos grátis — 1 crédito = 1 lead único
            entregue, dedup automaticamente.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/#/app"
              data-cta="faq-open-app"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-orange-600/25 transition-transform hover:scale-[1.03]"
            >
              Criar conta grátis
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-zinc-700 transition-colors hover:border-orange-200 hover:text-primary"
            >
              Ver planos
            </Link>
          </div>
        </section>
      </div>

      <JsonLd
        data={[
          faqPageLd,
          breadcrumbLd([
            { label: 'Início', href: `${SITE.url}/` },
            { label: 'FAQ', href: `${SITE.url}/faq` },
          ]),
        ]}
      />
    </div>
  )
}
