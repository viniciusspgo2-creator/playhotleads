// src/lib/seo.ts
// Fábrica de Metadata do Next (App Router) — canonical absoluto, OG/Twitter,
// robots refinado e keywords por página. Toda página pública usa buildPageMetadata
// para garantir consistência entre canonical ↔ sitemap ↔ llms.txt (nunca conflito).

import type { Metadata } from 'next'
import { SITE } from '@/content/site-config'

export const OG_IMAGE = '/og/og-default.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export interface PageSeoInput {
  /** caminho a partir da raiz ('' p/ home, '/blog', '/blog/meu-post'…) */
  path: string
  /** título da página (o template do layout acrescenta a marca) */
  title: string
  description: string
  keywords?: string[]
  /** desabilita indexação (áreas internas) */
  noIndex?: boolean
  ogType?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
}

export function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '')
  if (!path || path === '/') return `${base}/`
  return `${base}/${path.replace(/^\//, '')}`
}

export function buildPageMetadata({
  path,
  title,
  description,
  keywords,
  noIndex,
  ogType = 'website',
  publishedTime,
  modifiedTime,
  authors,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path)
  const fullTitle =
    path === '/' ? title : `${title} | ${SITE.name}`

  const robots = noIndex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large' as const,
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      }

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical: url },
    robots,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE.name,
      locale: SITE.ogLocale,
      type: ogType,
      images: [{ url: `${SITE.url}${OG_IMAGE}`, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `${SITE.name} — ${SITE.shortDescription}` }],
      ...(ogType === 'article' && publishedTime ? { publishedTime } : {}),
      ...(ogType === 'article' && modifiedTime ? { modifiedTime } : {}),
      ...(ogType === 'article' && authors ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`${SITE.url}${OG_IMAGE}`],
    },
  }
}
