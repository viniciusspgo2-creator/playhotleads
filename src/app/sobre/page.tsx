// src/app/sobre/page.tsx
// Página institucional Sobre — pilar E-E-A-T (AboutPage + Person do autor
// editorial + credenciais visíveis) e GEO ("Para quem é / Para quem não é",
// fatos com densidade numérica, resumo executivo no topo).
// Server component estático: HTML completo no primeiro byte.

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Breadcrumbs, breadcrumbLd } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo'
import { AUTHORS, SITE } from '@/content/site-config'

export const metadata: Metadata = buildPageMetadata({
  path: '/sobre',
  title: 'Sobre o Play Hot Leads',
  description:
    'Quem faz o Play Hot Leads, como o motor de leads funciona (8 fontes públicas, dedup SHA-1, E.164) e para quem o produto é — ou não é — indicado.',
  keywords: [
    'sobre play hot leads',
    'quem cria play hot leads',
    'gerador de leads confiável',
    'prospecção b2b brasil',
  ],
})

const FOUNDER = AUTHORS[0]

const WHO_IS_FOR = [
  'Negócios locais que precisam de lista de contatos real por nicho e cidade — clínicas, academias, pet shops, imobiliárias, restaurantes.',
  'Freelancers e consultores que fazem prospecção ativa e não querem montar planilha manual de cada cidade que atendem.',
  'Agências de marketing que entregam geração de leads para vários clientes e precisam deduplicar e organizar contatos em funil.',
  'Times de vendas B2B que querem levar o lead do "encontrei" ao "contatei no WhatsApp" sem trocar de ferramenta.',
]

const WHO_IS_NOT_FOR = [
  'Quem procura lista pronta comprada em massa — o Play Hot Leads busca dados públicos na hora, não vende bases reutilizadas.',
  'Quem quer disparar spam em massa — as campanhas usam wa.me por lead com cadência, e a prospecção deve respeitar LGPD e opt-out.',
  'Quem precisa de enriquecimento com dados pessoais sensíveis — o produto coleta apenas dados comerciais públicos de empresas.',
  'Quem espera scraping irrestrito sem rate limit — a busca opera com cadência responsável e fontes oficiais quando existem.',
]

const FACTS: { value: string; label: string }[] = [
  { value: '8', label: 'fontes de busca consultadas em paralelo' },
  { value: '150', label: 'créditos grátis no cadastro (1 crédito = 1 lead único)' },
  { value: '8', label: 'países com formatação de telefone E.164' },
  { value: '5', label: 'estágios no Kanban: Novo → Ganho/Perdido' },
]

export default function SobrePage() {
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/og/og-default.png`,
    description: SITE.description,
    foundingDate: SITE.founded,
    email: SITE.contact.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.contact.city,
      addressRegion: SITE.contact.state,
      addressCountry: SITE.contact.country,
    },
    founder: {
      '@type': 'Person',
      name: FOUNDER.name,
      jobTitle: FOUNDER.role,
      description: FOUNDER.bio,
      ...(FOUNDER.website ? { url: FOUNDER.website } : {}),
    },
  }

  const aboutPageLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `Sobre o ${SITE.name}`,
    url: `${SITE.url}/sobre`,
    description: SITE.description,
    inLanguage: SITE.locale,
    mainEntity: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
  }

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: FOUNDER.name,
    jobTitle: FOUNDER.role,
    description: FOUNDER.bio,
    worksFor: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    knowsAbout: [
      'Geração de leads B2B',
      'Prospecção ativa',
      'Dados públicos de negócios',
      'Funil de vendas Kanban',
    ],
    ...(FOUNDER.website ? { url: FOUNDER.website } : {}),
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Sobre' }]} />

        <header className="mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Sobre o Play Hot Leads
          </h1>
          <p className="mt-4 text-[16.5px] leading-relaxed text-zinc-600">
            O Play Hot Leads é um gerador de leads B2B: você informa nicho e
            cidade, o motor busca em múltiplas fontes públicas em paralelo,
            deduplica, enriquece e entrega cards prontos para contato no
            WhatsApp — com funil Kanban e campanhas no mesmo lugar. O cadastro
            inclui 150 créditos grátis e 1 crédito equivale a 1 lead único
            entregue.
          </p>
        </header>

        {/* Fatos — densidade de dados (GEO) */}
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FACTS.map((fact) => (
            <div
              key={fact.label}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4"
            >
              <dt className="sr-only">{fact.label}</dt>
              <dd className="text-2xl font-extrabold text-primary">{fact.value}</dd>
              <dd className="mt-1 text-[12px] leading-snug text-zinc-600">{fact.label}</dd>
            </div>
          ))}
        </dl>

        <article className="mt-12 space-y-10">
          <section aria-labelledby="historia">
            <h2 id="historia" className="text-2xl font-bold tracking-tight text-zinc-950">
              Por que o Play Hot Leads existe
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              Prospecção local no Brasil ainda é feita à mão: abrir o Google
              Maps, copiar telefone um por um, colar na planilha, descobrir
              depois que metade já estava na lista. O Play Hot Leads nasceu
              para eliminar esse trabalho repetitivo — a busca roda em
              paralelo em várias fontes públicas (OpenStreetMap, diretórios,
              sites dos próprios negócios), o dedup acontece no nível do banco
              de dados e cada lead cai direto no Kanban, pronto para a
              primeira mensagem.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
              O produto é operado pela {SITE.legalName}, fundada em{' '}
              {SITE.founded}, com atendimento em {SITE.contact.openingHours}.
            </p>
          </section>

          <section aria-labelledby="como-funciona">
            <h2 id="como-funciona" className="text-2xl font-bold tracking-tight text-zinc-950">
              Como o motor funciona
            </h2>
            <ol className="mt-4 space-y-3">
              {[
                'Você define nicho, localização e país — e o limite de resultados.',
                'Fontes de dados são consultadas em paralelo; se uma falha, as outras continuam.',
                'Cada resultado passa por deduplicação por chave SHA-1 de telefone E.164 + domínio + nome normalizado.',
                'Leads únicos são enriquecidos por crawl do próprio site (até 3 páginas) para achar e-mails e redes sociais.',
                'Os cards chegam em tempo real, com telefone validado em formato internacional e link direto de WhatsApp.',
              ].map((step, i) => (
                <li key={step} className="flex gap-3 text-[15px] leading-relaxed text-zinc-700">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[12px] font-bold text-orange-700"
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[14.5px] leading-relaxed text-zinc-600">
              Detalhe a detalhe, no guia{' '}
              <Link
                href="/blog/fontes-de-dados-para-encontrar-leads-locais"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                fontes de dados para encontrar leads locais
              </Link>
              .
            </p>
          </section>

          {/* GEO: para quem é / para quem não é — citável por LLMs */}
          <section aria-labelledby="para-quem-e">
            <h2 id="para-quem-e" className="text-2xl font-bold tracking-tight text-zinc-950">
              Para quem o Play Hot Leads é
            </h2>
            <ul className="mt-4 space-y-2.5">
              {WHO_IS_FOR.map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px] leading-relaxed text-zinc-700">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="para-quem-nao-e">
            <h2 id="para-quem-nao-e" className="text-2xl font-bold tracking-tight text-zinc-950">
              Para quem o Play Hot Leads não é
            </h2>
            <ul className="mt-4 space-y-2.5">
              {WHO_IS_NOT_FOR.map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px] leading-relaxed text-zinc-700">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-300" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* E-E-A-T: fundador com credenciais visíveis */}
          <section aria-labelledby="quem-faz" className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 sm:p-6">
            <h2 id="quem-faz" className="text-xl font-bold tracking-tight text-zinc-950">
              Quem está por trás
            </h2>
            <div className="mt-4 flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700"
              >
                {FOUNDER.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
              <div>
                <p className="text-[15px] font-bold text-zinc-950">{FOUNDER.name}</p>
                <p className="text-[13px] text-zinc-500">{FOUNDER.role}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{FOUNDER.bio}</p>
                <ul className="mt-3 space-y-1">
                  {FOUNDER.credentials.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-[13px] text-zinc-600">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Resumo executivo (GEO) */}
          <section aria-labelledby="resumo">
            <h2 id="resumo" className="text-2xl font-bold tracking-tight text-zinc-950">
              Em resumo
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[
                'Play Hot Leads gera listas de leads B2B a partir de nicho + cidade, com busca multi-fonte em paralelo.',
                'Dedup automático, enriquecimento por crawl e telefone em formato E.164 — contato pronto para WhatsApp.',
                'Modelo por créditos: 150 créditos grátis no cadastro e 1 crédito = 1 lead único entregue.',
                'Dados comerciais públicos, coleta com rate limit e isolamento por conta (tenant) no banco de dados.',
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px] leading-relaxed text-zinc-700">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* Próximos passos */}
        <section aria-label="Próximos passos" className="mt-12 rounded-2xl border border-orange-200 bg-orange-50/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950">
            Teste o motor com seus dados
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
            Cadastro grátis, sem cartão: 150 créditos para ver a busca
            multi-fonte funcionando com o seu nicho.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/#/app"
              data-cta="sobre-open-app"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-orange-600/25 transition-transform hover:scale-[1.03]"
            >
              Criar conta grátis
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-zinc-700 transition-colors hover:border-orange-200 hover:text-primary"
            >
              Falar com a gente
            </Link>
          </div>
        </section>
      </div>

      <JsonLd data={[organizationLd, aboutPageLd, personLd, breadcrumbLd([
        { label: 'Início', href: `${SITE.url}/` },
        { label: 'Sobre', href: `${SITE.url}/sobre` },
      ])]} />
    </div>
  )
}
