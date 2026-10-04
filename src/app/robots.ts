// src/app/robots.ts
// robots.txt dinâmico — estratégia dupla do projeto:
//   1) SEO clássico: Googlebot/Bingbot indexam tudo, exceto /api/.
//   2) GEO/LLMO: crawlers de IA (GPTBot, PerplexityBot, ClaudeBot, CCBot…)
//      EXPLICITAMENTE PERMITIDOS — o conteúdo editorial é fonte citável
//      para ChatGPT, Perplexity, Claude, Gemini e afins.
// Cada grupo de user-agent tem regras próprias: um bot só lê o grupo mais
// específico, então os crawlers de IA NÃO herdam o grupo '*'.
// Nota: o app vive em /#/app (hash) — nunca vai ao servidor; /api/ é a única
// área a bloquear. O sitemap é referenciado para descoberta no GSC.

import type { MetadataRoute } from 'next'
import { SITE } from '@/content/site-config'

/** Crawlers de motores generativos — permitidos por política (GEO). */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'CCBot',
  'YouBot',
  'Meta-ExternalAgent',
] as const

/** Buscadores clássicos. */
const SEARCH_CRAWLERS = ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot'] as const

/** Regras comuns: conteúdo todo aberto, área de API fechada. */
const PUBLIC_RULES = {
  allow: '/',
  disallow: ['/api/'],
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: [...SEARCH_CRAWLERS], ...PUBLIC_RULES },
      { userAgent: [...AI_CRAWLERS], ...PUBLIC_RULES },
      // Demais bots seguem o grupo '*'.
      { userAgent: '*', ...PUBLIC_RULES },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
