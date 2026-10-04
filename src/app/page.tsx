// src/app/page.tsx
// Rota única do produto: landing de vendas (default) + dashboard completo
// (#/app). O ViewManager alterna os wrappers client-side, preservando o
// estado de ambos (streams SSE, forms).
//
// Wrapper em flex-col + footer com mt-auto = footer da landing sempre
// colado no fim da viewport e empurrado naturalmente quando o conteúdo
// cresce.
//
// SEO: metadata própria + JSON-LD server-side (WebPage, FAQPage da landing,
// Service) — o conteúdo textual das seções já é SSR (rastreável sem JS).

import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { LiveDemo } from '@/components/landing/live-demo'
import { Providers } from '@/components/landing/providers'
import { Features } from '@/components/landing/features'
import { Pipeline } from '@/components/landing/pipeline'
import { Pricing } from '@/components/landing/pricing'
import { Faq } from '@/components/landing/faq'
import { LANDING_FAQ } from '@/content/faq-landing'
import { Cta } from '@/components/landing/cta'
import { Footer } from '@/components/landing/footer'
import { ViewManager } from '@/components/app/view-manager'
import { AppShell } from '@/components/app/app-shell'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo'
import { SITE } from '@/content/site-config'

export const metadata: Metadata = buildPageMetadata({
  path: '/',
  title: `${SITE.name} — Nicho + cidade viram leads quentes em segundos`,
  description: SITE.description,
  keywords: [
    'gerador de leads',
    'prospecção b2b',
    'captação de leads',
    'gerar leads por cidade',
    'leads whatsapp',
    'google places',
    'kanban de leads',
    'saas de leads',
  ],
})

/** WebPage + FAQPage + Service — derivados do conteúdo REAL da landing. */
function HomeJsonLd() {
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${SITE.name} — Nicho + cidade viram leads quentes em segundos`,
    url: `${SITE.url}/`,
    description: SITE.description,
    inLanguage: SITE.locale,
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: `${SITE.url}/` },
    about: {
      '@type': 'Service',
      name: 'Geração de leads B2B multi-fonte',
      serviceType: 'Geração de leads / prospecção ativa',
      provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      areaServed: SITE.contact.areaServed.map((c) => ({ '@type': 'Country', name: c })),
      description: SITE.shortDescription,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BRL',
        lowPrice: 0,
        highPrice: 297,
        offerCount: 3,
        description:
          'Plano gratuito com 150 créditos (1 crédito = 1 lead único) e planos pagos mensais.',
      },
    },
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return <JsonLd data={[webPage, faqPage]} />
}

export default function Home() {
  return (
    <>
      <div id="view-landing" className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <LiveDemo />
          <Providers />
          <Features />
          <Pipeline />
          <Pricing />
          <Faq />
          <Cta />
        </main>
        <Footer />
      </div>

      <div id="view-app" style={{ display: 'none' }}>
        <AppShell />
      </div>

      <ViewManager />
      <HomeJsonLd />
    </>
  )
}
