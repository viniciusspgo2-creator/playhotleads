// src/components/landing/footer.tsx
// Footer da landing. Server component. O sticky-to-bottom é garantido pelo
// wrapper flex (min-h-screen flex flex-col) + mt-auto aqui, no page.tsx.

import { Flame } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

// Linkagem interna descritiva: âncoras da landing + páginas de conteúdo
// (/blog, /glossario, /faq, /sobre, /precos, /contato) — zero link morto.
const FOOTER_COLS = [
  {
    title: 'Produto',
    links: [
      { label: 'Demonstração', href: '#demo' },
      { label: 'Fontes de dados', href: '#fontes' },
      { label: 'Funcionalidades', href: '#funcionalidades' },
      { label: 'Preços', href: '#precos' },
    ],
  },
  {
    title: 'Conteúdo',
    links: [
      { label: 'Blog de prospecção', href: '/blog' },
      { label: 'Glossário de vendas', href: '/glossario' },
      { label: 'Perguntas frequentes', href: '/faq' },
      { label: 'Guia LGPD para prospecção', href: '/blog/lgpd-e-prospeccao-de-leads' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre o Play Hot Leads', href: '/sobre' },
      { label: 'Planos e créditos', href: '/precos' },
      { label: 'Contato', href: '/contato' },
      { label: 'Abrir o app', href: '/#/app' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Flame className="size-5" aria-hidden="true" />
              </span>
              <span className="text-[17px] font-bold tracking-tight text-zinc-900">
                Play<span className="text-primary"> Hot Leads</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-zinc-600">
              Nicho + cidade viram leads quentes em segundos. Busca multi-fonte em tempo
              real, dedup automático e gestão no Kanban.
            </p>
          </div>

          {/* Colunas de links */}
          {FOOTER_COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[13px] font-bold tracking-wide text-zinc-900 uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13.5px] text-zinc-600 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Barra inferior */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-zinc-500">
            © {new Date().getFullYear()} Play Hot Leads. Todos os direitos reservados.
          </p>
          <p className="max-w-xl text-[12px] leading-relaxed text-zinc-400">
            Buscamos apenas dados públicos de negócios, com rate limit e cadência
            responsáveis. Fontes com API oficial são priorizadas.
          </p>
        </div>
      </div>
    </footer>
  )
}
