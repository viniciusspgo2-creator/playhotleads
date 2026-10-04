// src/app/blog/page.tsx
// Índice do blog — hub de conteúdo (GEO: topic cluster). Server component
// estático: o HTML do hub sai completo no HTML inicial. JSON-LD Blog + ItemList.

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs, breadcrumbLd } from '@/components/seo/breadcrumbs'
import { buildPageMetadata } from '@/lib/seo'
import { POSTS } from '@/content/posts'
import { SITE } from '@/content/site-config'

export const metadata: Metadata = buildPageMetadata({
  path: '/blog',
  title: 'Blog — Prospecção B2B, leads e vendas',
  description:
    'Guias definitivos sobre geração de leads, prospecção por nicho e localização, WhatsApp para vendas, Kanban e LGPD — conteúdo técnico e citável do Play Hot Leads.',
  keywords: [
    'blog prospecção',
    'guias de vendas',
    'geração de leads',
    'content marketing b2b',
  ],
})

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(iso)).replace('.', '')
}

export default function BlogPage() {
  const featured = POSTS.find((p) => p.featured) ?? POSTS[0]
  const rest = POSTS.filter((p) => p.slug !== featured.slug)

  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Blog ${SITE.name}`,
    url: `${SITE.url}/blog`,
    description:
      'Guias e métodos sobre geração de leads B2B, prospecção local, WhatsApp e funil de vendas.',
    inLanguage: SITE.locale,
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    blogPost: POSTS.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE.url}/blog/${p.slug}`,
      datePublished: p.datePublished,
      dateModified: p.dateModified,
    })),
  }

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Artigos do blog Play Hot Leads',
    itemListElement: POSTS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/blog/${p.slug}`,
      name: p.title,
    })),
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <Breadcrumbs
          items={[{ label: 'Início', href: '/' }, { label: 'Blog' }]}
        />

        <header className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Blog: prospecção, leads e vendas B2B
          </h1>
          <p className="mt-4 text-[16.5px] leading-relaxed text-zinc-600">
            Guias diretos e aplicáveis — do método de prospecção por nicho e
            localização ao uso profissional do WhatsApp. Escrito pela equipe que
            opera o motor de leads do {SITE.name}.
          </p>
        </header>

        {/* Post em destaque */}
        <article className="mt-10">
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full font-semibold">
                Destaque
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-zinc-200 bg-white text-zinc-600"
              >
                {featured.category}
              </Badge>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-950 group-hover:text-primary sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
              {featured.description}
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-zinc-500">
              <span>{formatDate(featured.datePublished)}</span>
              <span className="flex items-center gap-1">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {featured.readingMinutes} min
              </span>
            </p>
          </Link>
        </article>

        {/* Demais artigos */}
        <section
          aria-label="Todos os artigos"
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          {rest.map((post) => (
            <article key={post.slug} className="h-full">
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <Badge
                  variant="outline"
                  className="w-fit rounded-full border-zinc-200 bg-zinc-50 text-zinc-600"
                >
                  {post.category}
                </Badge>
                <h2 className="mt-3 text-lg font-bold tracking-tight text-zinc-950 group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-zinc-600">
                  {post.description}
                </p>
                <p className="mt-4 flex items-center gap-3 text-[12.5px] text-zinc-500">
                  <span>{formatDate(post.datePublished)}</span>
                  <span className="flex items-center gap-1">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {post.readingMinutes} min
                  </span>
                  <span className="ml-auto font-semibold text-primary">
                    Ler
                    <ArrowRight className="ml-1 inline size-3.5" aria-hidden="true" />
                  </span>
                </p>
              </Link>
            </article>
          ))}
        </section>
      </div>

      <JsonLd
        data={[
          blogLd,
          itemListLd,
          breadcrumbLd([
            { label: 'Início', href: `${SITE.url}/` },
            { label: 'Blog', href: `${SITE.url}/blog` },
          ]),
        ]}
      />
    </div>
  )
}
