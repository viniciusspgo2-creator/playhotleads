// src/content/types.ts
// Contrato tipado do conteúdo editorial (blog, glossário, FAQ institucional).
// O renderer (src/components/seo/article-renderer.tsx) converte cada bloco em
// HTML semântico server-side (SSR/SSG) — zero dangerouslySetInnerHTML.
// Regra GEO: todo bloco é parseável por LLMs (párrafo direto, tabela, lista,
// FAQ estruturada), e o JSON-LD é derivado dos MESMOS dados (fonte única).

/** Bloco de conteúdo editorial — união discriminada por `type`. */
export type Block =
  | { type: 'takeaways'; items: string[] }
  | { type: 'bluf'; text: string }
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'steps'; title: string; steps: { name: string; text: string }[] }
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | {
      type: 'callout'
      variant: 'info' | 'tip' | 'warning'
      title?: string
      text: string
    }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | {
      type: 'links'
      title?: string
      items: { label: string; href: string; description: string }[]
    }
  | { type: 'summary'; items: string[] }

/** Autor editorial — E-E-A-T: biografia e credenciais visíveis + Person schema. */
export interface Author {
  id: string
  name: string
  role: string
  bio: string
  credentials: string[]
  linkedin?: string
  website?: string
}

/** Artigo do blog — frontmatter completo p/ Article JSON-LD + meta tags. */
export interface BlogPost {
  slug: string
  /** título SEO (até ~60 chars) usado em <title> e <h1> */
  title: string
  /** meta description (até ~155 chars) */
  description: string
  keywords: string[]
  category: string
  tags: string[]
  authorId: string
  /** ISO 8601 */
  datePublished: string
  /** ISO 8601 */
  dateModified: string
  readingMinutes: number
  featured?: boolean
  blocks: Block[]
  /** slugs de posts relacionados — linkagem interna descritiva */
  related: string[]
}

/** Termo do glossário — DefinedTerm schema, definição direta e citável. */
export interface GlossaryTerm {
  slug: string
  term: string
  /** definição objetiva em 1–3 frases (BLUF) */
  definition: string
  /** por que importa na prática (2–4 frases) */
  importance: string
  /** slugs de outros termos */
  relatedTerms: string[]
}

/** Pergunta institucional — usada em /faq e FAQPage JSON-LD. */
export interface FaqItem {
  q: string
  a: string
}
