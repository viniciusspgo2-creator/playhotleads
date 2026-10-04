// src/components/seo/breadcrumbs.tsx
// Trilha visual (nav[aria-label]) + fábrica do schema BreadcrumbList.
// O último item não é link (página corrente) — padrão do Google.

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  /** href relativo ('/blog') ou undefined no item corrente */
  href?: string
}

export function breadcrumbLd(items: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  }
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="font-medium text-zinc-700">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="size-3.5 text-zinc-400" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
