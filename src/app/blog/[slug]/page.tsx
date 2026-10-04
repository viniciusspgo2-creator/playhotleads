// src/app/blog/[slug]/page.tsx
// Artigo do blog — SSG com generateStaticParams + generateMetadata à prova de
// banco vazio (try/catch em tudo que toca dados — regra do deploy na Vercel).
// JSON-LD: BlogPosting (E-E-A-T: autor Person + dates) + BreadcrumbList +
// FAQPage + HowTo derivados dos MESMOS blocos do artigo (fonte única).

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { ArticleRenderer, slugify } from '@/components/seo/article-renderer'
import { PageShell } from '@/components/seo/page-shell'
import { JsonLd } from '@/components/seo/json-ld'
import { buildPageMetadata, absoluteUrl } from '@/lib/seo'
import { POSTS, getPostBySlug, getRelatedPosts } from '@/content/posts'
import { getAuthor, SITE } from '@/content/site-config'
import type { Block, BlogPost } from '@/content/types'

interface PostProps {
  params: Promise<{ slug: string }>
}

/** Static generation dos 6 slugs — try/catch com fallback vazio. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    return POSTS.map((post) => ({ slug: post.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = getPostBySlug(slug)
    if (!post) {
      return buildPageMetadata({
        path: `/blog/${slug}`,
        title: 'Artigo não encontrado',
        description: 'Este artigo não existe ou foi movido.',
        noIndex: true,
      })
    }
    return buildPageMetadata({
      path: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      keywords: post.keywords,
      ogType: 'article',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [getAuthor(post.authorId).name],
    })
  } catch {
    return { title: 'Blog | Play Hot Leads' }
  }
}

/** HowTo schema — gerado dos blocos 'steps' do próprio artigo. */
function howToLd(blocks: Block[]) {
  return blocks
    .filter((b): b is Extract<Block, { type: 'steps' }> => b.type === 'steps')
    .map((block) => ({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: block.title,
      step: block.steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.name,
        text: step.text,
      })),
    }))
}

/** FAQPage schema — gerado dos blocos 'faq' do próprio artigo. */
function faqLd(blocks: Block[]) {
  return blocks
    .filter((b): b is Extract<Block, { type: 'faq' }> => b.type === 'faq')
    .map((block) => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: block.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }))
}

export default async function BlogPostPage({ params }: PostProps) {
  const { slug } = await params

  let post: BlogPost | undefined
  try {
    post = getPostBySlug(slug)
  } catch {
    post = undefined
  }
  if (!post) notFound()

  const author = getAuthor(post.authorId)
  const related = getRelatedPosts(post)
  const url = absoluteUrl(`/blog/${post.slug}`)

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    inLanguage: SITE.locale,
    keywords: post.keywords.join(', '),
    articleSection: post.category,
    wordCount: Math.round(post.readingMinutes * 180),
    image: `${SITE.url}/og/og-default.png`,
    author: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.role,
      description: author.bio,
      ...(author.website ? { url: author.website } : {}),
      ...(author.linkedin ? { sameAs: [author.linkedin] } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: { '@type': 'ImageObject', url: `${SITE.url}/og/og-default.png` },
    },
  }

  const breadcrumbLdData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE.url}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE.url}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title },
    ],
  }

  const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const dateLabel = DATE_FMT.format(new Date(post.dateModified))

  return (
    <PageShell
      crumbs={[{ label: 'Início', href: '/' }, { label: 'Blog', href: '/blog' }, { label: post.title }]}
      h1={post.title}
      lead={post.description}
      meta={{ authorId: post.authorId, dateLabel, readingMinutes: post.readingMinutes }}
    >
      <ArticleRenderer blocks={post.blocks} />

      {/* Caixa de autor — E-E-A-T visível (experiência e credenciais reais) */}
      <section aria-label="Sobre o autor" className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700"
          >
            {author.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </span>
          <div>
            <p className="text-[15px] font-bold text-zinc-950">{author.name}</p>
            <p className="text-[13px] text-zinc-500">{author.role}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{author.bio}</p>
            <ul className="mt-3 space-y-1">
              {author.credentials.map((c) => (
                <li key={c} className="flex items-start gap-2 text-[13px] text-zinc-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Related — linkagem interna descritiva (topic cluster) */}
      {related.length > 0 && (
        <section aria-label="Artigos relacionados" className="mt-10">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            Continue lendo
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <span className="text-[11.5px] font-bold tracking-wide text-primary uppercase">
                  {rel.category}
                </span>
                <span className="mt-1.5 flex-1 text-[14.5px] font-semibold leading-snug text-zinc-950 group-hover:text-primary">
                  {rel.title}
                </span>
                <span className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-zinc-500">
                  Ler agora
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Âncoras do artigo (H2) — navegação rápida + reforço de semântica */}
      <nav aria-label="Seções deste artigo" className="mt-10 rounded-2xl bg-zinc-50 p-5">
        <p className="text-[12px] font-bold tracking-wide text-zinc-500 uppercase">
          Neste artigo
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {post.blocks
            .filter((b): b is Extract<Block, { type: 'h2' }> => b.type === 'h2')
            .map((h) => (
              <li key={h.text}>
                <a
                  href={`#${slugify(h.text)}`}
                  className="text-[13.5px] font-medium text-zinc-600 underline-offset-2 transition-colors hover:text-primary hover:underline"
                >
                  {h.text}
                </a>
              </li>
            ))}
        </ul>
      </nav>

      <JsonLd
        data={[
          articleLd,
          breadcrumbLdData,
          ...howToLd(post.blocks),
          ...faqLd(post.blocks),
        ]}
      />
    </PageShell>
  )
}
