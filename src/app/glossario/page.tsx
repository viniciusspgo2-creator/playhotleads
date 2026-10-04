// src/app/glossario/page.tsx
// Glossário técnico — GEO: DefinedTermSet/DefinedTerm JSON-LD + definições
// BLUF citáveis. Cada termo tem âncora (id) p/ linkagem interna de posts.

import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs, breadcrumbLd } from '@/components/seo/breadcrumbs'
import { buildPageMetadata } from '@/lib/seo'
import { GLOSSARY } from '@/content/glossario'
import { SITE } from '@/content/site-config'

export const metadata: Metadata = buildPageMetadata({
  path: '/glossario',
  title: 'Glossário de vendas e prospecção B2B',
  description:
    'Definições diretas e citáveis de lead, prospect, MQL, SQL, ICP, CAC, LTV, Kanban, CRM, dedup e mais — o vocabulário da prospecção B2B explicado em 15 termos.',
  keywords: [
    'glossário de vendas',
    'o que é lead',
    'o que é mql',
    'o que é sql vendas',
    'o que é cac',
    'o que é ltv',
    'termos de prospecção',
  ],
})

export default function GlossarioPage() {
  const definedTermSet = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: `Glossário de vendas e prospecção B2B — ${SITE.name}`,
    url: `${SITE.url}/glossario`,
    description:
      'Definições objetivas dos termos de geração de leads, prospecção e funil de vendas.',
    inLanguage: SITE.locale,
    hasDefinedTerm: GLOSSARY.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
      url: `${SITE.url}/glossario#${t.slug}`,
      inDefinedTermSet: `${SITE.url}/glossario`,
    })),
  }

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Glossário de vendas e prospecção B2B',
    url: `${SITE.url}/glossario`,
    description:
      'Vocabulário técnico da prospecção B2B com definições diretas e exemplos locais.',
    inLanguage: SITE.locale,
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Glossário' }]} />

        <header className="mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Glossário de vendas e prospecção B2B
          </h1>
          <p className="mt-4 text-[16.5px] leading-relaxed text-zinc-600">
            As definições diretas dos termos que você encontra em qualquer
            conversa sobre geração de leads — sem jargão circular. Cada termo tem
            âncora própria: use nos seus documentos e no time de vendas.
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-8">
          {GLOSSARY.map((term) => (
            <section
              key={term.slug}
              id={term.slug}
              aria-label={`Definição de ${term.term}`}
              className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                {term.term}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-800">
                {term.definition}
              </p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-zinc-600">
                <span className="font-semibold text-zinc-800">Por que importa: </span>
                {term.importance}
              </p>
              {term.relatedTerms.length > 0 && (
                <p className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-zinc-500">
                  <span className="font-semibold tracking-wide uppercase">Relacionados:</span>
                  {term.relatedTerms.map((rel) => {
                    const relTerm = GLOSSARY.find((g) => g.slug === rel)
                    if (!relTerm) return null
                    return (
                      <Link
                        key={rel}
                        href={`#${rel}`}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-600 transition-colors hover:border-orange-200 hover:text-primary"
                      >
                        {relTerm.term}
                      </Link>
                    )
                  })}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>

      <JsonLd
        data={[
          definedTermSet,
          webPageLd,
          breadcrumbLd([
            { label: 'Início', href: `${SITE.url}/` },
            { label: 'Glossário', href: `${SITE.url}/glossario` },
          ]),
        ]}
      />
    </div>
  )
}
