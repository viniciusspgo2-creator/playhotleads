// src/app/contato/page.tsx
// Página de contato — ContactPage JSON-LD + ContactPoint, canais reais
// (e-mail, horário, FAQ) e resposta BLUF por canal. Server component estático.

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock3, LifeBuoy, Mail } from 'lucide-react'
import { Breadcrumbs, breadcrumbLd } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo'
import { SITE } from '@/content/site-config'

export const metadata: Metadata = buildPageMetadata({
  path: '/contato',
  title: 'Contato — suporte e vendas',
  description:
    'Fale com o time do Play Hot Leads: suporte técnico, dúvidas sobre planos e créditos, parcerias. E-mail contato@playhotleads.com, Seg–Sex 09:00–18:00 BRT.',
  keywords: [
    'contato play hot leads',
    'suporte gerador de leads',
    'falar com play hot leads',
  ],
})

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'Suporte ao produto',
    bluf: 'Problemas com busca, créditos, Kanban ou campanhas: escreva para o suporte — respondemos em dias úteis.',
    body: 'Inclua na mensagem o e-mail da sua conta e, se possível, o nicho/cidade da busca com problema. Isso acelera o diagnóstico.',
  },
  {
    icon: Mail,
    title: 'Planos e vendas',
    bluf: 'Dúvidas sobre planos, faturamento, volumes de créditos ou nota fiscal: o mesmo e-mail atende, marcando o assunto como "Comercial".',
    body: 'Para volumes acima do plano Business (agências e times), descreva o volume mensal estimado de leads que você precisa.',
  },
  {
    icon: Clock3,
    title: 'Tempo de resposta',
    bluf: `Atendimento de ${SITE.contact.openingHours}. E-mails recebidos fora do horário entram na fila do próximo dia útil.`,
    body: 'Perguntas rápidas sobre produto e créditos têm resposta imediata na página de perguntas frequentes.',
  },
]

export default function ContatoPage() {
  const contactPageLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contato — ${SITE.name}`,
    url: `${SITE.url}/contato`,
    description:
      'Canais oficiais de contato do Play Hot Leads: suporte técnico, comercial e horário de atendimento.',
    inLanguage: SITE.locale,
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    about: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      contactPoint: {
        '@type': 'ContactPoint',
        email: SITE.contact.email,
        contactType: 'customer support',
        areaServed: SITE.contact.areaServed,
        availableLanguage: ['Portuguese', 'English', 'Spanish'],
      },
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Contato' }]} />

        <header className="mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Falar com o Play Hot Leads
          </h1>
          <p className="mt-4 text-[16.5px] leading-relaxed text-zinc-600">
            O canal oficial é o e-mail{' '}
            <a
              href={`mailto:${SITE.contact.email}?subject=Contato%20pelo%20site`}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              {SITE.contact.email}
            </a>{' '}
            — um único endereço para suporte, comercial e parcerias, respondido
            em {SITE.contact.openingHours}.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CHANNELS.map((channel) => (
            <section
              key={channel.title}
              aria-label={channel.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <channel.icon className="size-5 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-[15.5px] font-bold text-zinc-950">{channel.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-700">{channel.bluf}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-500">{channel.body}</p>
            </section>
          ))}
        </div>

        {/* Atalhos — resolvem sem esperar resposta */}
        <section aria-labelledby="atalhos" className="mt-12">
          <h2 id="atalhos" className="text-2xl font-bold tracking-tight text-zinc-950">
            Resolva agora, sem esperar
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                href: '/faq',
                title: 'FAQ completa',
                desc: 'Créditos, fontes de dados, países, WhatsApp, LGPD e pagamentos — 12 respostas diretas.',
              },
              {
                href: '/precos',
                title: 'Planos e créditos',
                desc: 'Valores vigentes, comparativo de planos e perguntas sobre faturamento.',
              },
              {
                href: '/glossario',
                title: 'Glossário de vendas',
                desc: 'Definições de lead, MQL, SQL, CAC, LTV e mais — 15 termos com âncora própria.',
              },
              {
                href: '/blog',
                title: 'Blog de prospecção',
                desc: 'Guias de prospecção por nicho e localização, fontes de dados, Kanban e LGPD.',
              },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <span className="text-[15px] font-bold text-zinc-950 group-hover:text-primary">
                    {item.title}
                  </span>
                  <span className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-zinc-600">
                    {item.desc}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Abrir o app" className="mt-12 rounded-2xl border border-orange-200 bg-orange-50/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950">
            Sua conta já resolve a maioria dos casos
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
            Dentro do app você vê o saldo de créditos, histórico de buscas e o
            status dos pagamentos — sem precisar abrir chamado.
          </p>
          <Link
            href="/#/app"
            data-cta="contato-open-app"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground shadow-lg shadow-orange-600/25 transition-transform hover:scale-[1.03]"
          >
            Abrir o app
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

        <p className="mt-10 text-[12.5px] leading-relaxed text-zinc-500">
          {SITE.legalName} — {SITE.contact.city}/{SITE.contact.state},{' '}
          {SITE.contact.country}. Atendimento em português, inglês e espanhol.
        </p>
      </div>

      <JsonLd data={[contactPageLd, breadcrumbLd([
        { label: 'Início', href: `${SITE.url}/` },
        { label: 'Contato', href: `${SITE.url}/contato` },
      ])]} />
    </div>
  )
}
