// src/app/sitemap.xml via sitemap.ts
// Sitemap XML gerado pelo Next — serve em /sitemap.xml com o MESMO canonical
// base (SITE.url) usado em buildPageMetadata e robots.ts (nunca conflito).
// Inclui home, hub do blog, os 6 artigos (lastModified = dateModified do post)
// e as páginas institucionais. GSC-ready: pronta para "Adicionar sitemap".

import type { MetadataRoute } from 'next'
import { POSTS } from '@/content/posts'
import { SITE } from '@/content/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, '')

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/blog`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/precos`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/glossario`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/faq`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/sobre`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/contato`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const postRoutes: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: 'monthly',
    priority: post.featured ? 0.9 : 0.8,
  }))

  return [...staticRoutes, ...postRoutes]
}
