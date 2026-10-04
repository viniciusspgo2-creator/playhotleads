// src/content/posts/index.ts
// Agregador dos posts do blog — fonte única para /blog, /blog/[slug],
// sitemap.xml, llms.txt e JSON-LD (BlogPosting). Ordenado por publicação desc.

import type { BlogPost } from '@/content/types'
import { POST as whatsappPost } from './como-encontrar-leads-no-whatsapp'
import { POST as prospeccaoPost } from './prospeccao-por-nicho-e-localizacao'
import { POST as leadGenPost } from './o-que-e-lead-generacao'
import { POST as kanbanPost } from './kanban-de-vendas-como-organizar-leads'
import { POST as fontesPost } from './fontes-de-dados-para-encontrar-leads-locais'
import { POST as lgpdPost } from './lgpd-e-prospeccao-de-leads'

export const POSTS: BlogPost[] = [
  prospeccaoPost,
  fontesPost,
  whatsappPost,
  leadGenPost,
  lgpdPost,
  kanbanPost,
].sort(
  (a, b) =>
    new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
)

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}

/** Posts relacionados por ordem do frontmatter; completa com recentes se faltar. */
export function getRelatedPosts(post: BlogPost, max = 3): BlogPost[] {
  const related = post.related
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => Boolean(p) && p?.slug !== post.slug)
  if (related.length >= max) return related.slice(0, max)
  for (const p of POSTS) {
    if (related.length >= max) break
    if (p.slug !== post.slug && !related.some((r) => r.slug === p.slug)) {
      related.push(p)
    }
  }
  return related
}
