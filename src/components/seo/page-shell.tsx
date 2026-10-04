// src/components/seo/page-shell.tsx
// Moldura das páginas de conteúdo (blog, glossário, faq, institucionais):
// breadcrumbs, H1 único, subtítulo e metadados editoriais (autor/data/leitura).
// Server component — o HTML sai completo no primeiro byte (SSR/SSG).

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Clock3 } from 'lucide-react'
import { Breadcrumbs, type Crumb } from './breadcrumbs'
import { getAuthor } from '@/content/site-config'

interface PageShellProps {
  crumbs: Crumb[]
  h1: string
  lead?: string
  /** exibido sob o H1 quando é conteúdo editorial datado */
  meta?: { authorId?: string; dateLabel: string; readingMinutes?: number }
  children: ReactNode
}

export function PageShell({ crumbs, h1, lead, meta, children }: PageShellProps) {
  const author = meta?.authorId ? getAuthor(meta.authorId) : undefined
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <Breadcrumbs items={crumbs} />

        <header className="mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
            {h1}
          </h1>
          {lead && (
            <p className="mt-4 text-[16.5px] leading-relaxed text-zinc-600">{lead}</p>
          )}
          {meta && (
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-100 pb-6 text-[13px] text-zinc-500">
              {author && (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-700"
                  >
                    {author.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <span className="font-semibold text-zinc-700">{author.name}</span>
                  <span className="text-zinc-400">· {author.role}</span>
                </span>
              )}
              <span>
                Atualizado em{' '}
                <time dateTime={meta.dateLabel}>{meta.dateLabel}</time>
              </span>
              {typeof meta.readingMinutes === 'number' && (
                <span className="flex items-center gap-1">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {meta.readingMinutes} min de leitura
                </span>
              )}
            </div>
          )}
        </header>

        <article className="mt-8">{children}</article>

        <footer className="mt-14 border-t border-zinc-100 pt-6 text-[13px] text-zinc-500">
          <p>
            Conteúdo do blog{' '}
            <Link href="/" className="font-semibold text-zinc-700 hover:text-primary">
              Play Hot Leads
            </Link>{' '}
            — nicho + cidade viram leads quentes em segundos.
          </p>
        </footer>
      </div>
    </div>
  )
}
