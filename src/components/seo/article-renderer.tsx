// src/components/seo/article-renderer.tsx
// Renderer server-side dos blocos editoriais (types.ts) em HTML semântico:
// <article>, <section>, <details>/<summary>, <table>, <blockquote>.
// Regras GEO: BLUF destacado, takeaways no topo, headings com âncora (id),
// tabelas completas e FAQ em details/summary — tudo no HTML inicial (SSR/SSG).

import Link from 'next/link'
import {
  Check,
  Info,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  ListChecks,
  BookOpen,
} from 'lucide-react'
import type { Block } from '@/content/types'

/** slug estável p/ âncoras de heading (remove acentos, pontuação e espaços) */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/** **negrito** inline → <strong>. Texto puro entra como fragmento. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-zinc-900">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

const CALLOUT_STYLE = {
  info: {
    icon: Info,
    box: 'border-sky-200 bg-sky-50/70 text-sky-900',
    iconBox: 'bg-sky-100 text-sky-600',
  },
  tip: {
    icon: Lightbulb,
    box: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
    iconBox: 'bg-emerald-100 text-emerald-600',
  },
  warning: {
    icon: AlertTriangle,
    box: 'border-amber-200 bg-amber-50/70 text-amber-900',
    iconBox: 'bg-amber-100 text-amber-600',
  },
} as const

function Heading({ level, text }: { level: 2 | 3; text: string }) {
  const id = slugify(text)
  const Tag = level === 2 ? 'h2' : 'h3'
  return (
    <Tag id={id} className="group scroll-mt-24 tracking-tight text-zinc-950">
      <a
        href={`#${id}`}
        aria-label={`Link direto para a seção: ${text}`}
        className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        {level === 2 ? (
          <span className="block text-2xl font-bold sm:text-[1.75rem]">{text}</span>
        ) : (
          <span className="block text-lg font-bold sm:text-xl">{text}</span>
        )}
      </a>
    </Tag>
  )
}

export function FaqDetails({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="cursor-pointer list-none text-[15px] font-semibold text-zinc-900 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-3">
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">
            <Inline text={item.a} />
          </p>
        </details>
      ))}
    </div>
  )
}

/** Converte um Block em JSX semântico. Puro server component. */
export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'takeaways':
      return (
        <aside
          aria-label="Principais conclusões"
          className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 sm:p-6"
        >
          <p className="flex items-center gap-2 text-[13px] font-bold tracking-wide text-orange-800 uppercase">
            <ListChecks className="size-4" aria-hidden="true" />
            Principais conclusões
          </p>
          <ul className="mt-3 space-y-2.5">
            {block.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-zinc-700">
                <Check className="mt-1 size-4 shrink-0 text-orange-600" aria-hidden="true" />
                <span>
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ul>
        </aside>
      )

    case 'bluf':
      return (
        <blockquote className="rounded-2xl border-l-4 border-primary bg-zinc-50 px-5 py-4 text-[15.5px] leading-relaxed text-zinc-800 sm:px-6">
          <span className="mb-1.5 block text-[11.5px] font-bold tracking-[0.18em] text-primary uppercase">
            Resposta direta
          </span>
          <Inline text={block.text} />
        </blockquote>
      )

    case 'p':
      return (
        <p className="text-[15.5px] leading-[1.75] text-zinc-700">
          <Inline text={block.text} />
        </p>
      )

    case 'h2':
      return <Heading level={2} text={block.text} />

    case 'h3':
      return <Heading level={3} text={block.text} />

    case 'ul':
      return (
        <ul className="space-y-2.5 pl-1">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-zinc-700">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>
                <Inline text={item} />
              </span>
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className="space-y-3">
          {block.items.map((item, i) => (
            <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-zinc-700">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[12.5px] font-bold text-orange-700">
                {i + 1}
              </span>
              <span>
                <Inline text={item} />
              </span>
            </li>
          ))}
        </ol>
      )

    case 'steps':
      return (
        <section aria-label={block.title} className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-bold text-zinc-950">{block.title}</h3>
          <ol className="mt-4 space-y-4">
            {block.steps.map((step, i) => (
              <li key={step.name} className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold text-zinc-900">
                    <Inline text={step.name} />
                  </p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-zinc-600">
                    <Inline text={step.text} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )

    case 'table':
      return (
        <figure className="overflow-hidden rounded-2xl border border-zinc-200">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="w-full min-w-[36rem] border-collapse text-left text-[14px]">
              {/* <caption> é o único elemento de legenda válido DENTRO de <table>
                  (figcaption é filho de <figure> — causa hydration error aqui) */}
              {block.caption && <caption className="sr-only">{block.caption}</caption>}
              <thead>
                <tr className="bg-zinc-50">
                  {block.headers.map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="border-b border-zinc-200 px-4 py-3 text-[12.5px] font-bold tracking-wide text-zinc-700 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="border-b border-zinc-100 px-4 py-3 align-top leading-relaxed text-zinc-700"
                      >
                        <Inline text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      )

    case 'callout': {
      const style = CALLOUT_STYLE[block.variant]
      const Icon = style.icon
      return (
        <aside className={`flex gap-3 rounded-2xl border p-5 ${style.box}`}>
          <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${style.iconBox}`}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div>
            {block.title && (
              <p className="text-[14px] font-bold">{block.title}</p>
            )}
            <p className="mt-0.5 text-[14px] leading-relaxed">
              <Inline text={block.text} />
            </p>
          </div>
        </aside>
      )
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 border-zinc-300 pl-5 text-[16px] italic leading-relaxed text-zinc-700">
          <Inline text={block.text} />
          {block.cite && (
            <cite className="mt-2 block text-[13px] not-italic text-zinc-500">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      )

    case 'faq':
      return (
        <section aria-label="Perguntas frequentes deste artigo">
          <FaqDetails items={block.items} />
        </section>
      )

    case 'links':
      return (
        <aside aria-label="Próximos passos" className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[13px] font-bold tracking-wide text-zinc-800 uppercase">
            <ArrowRight className="size-4 text-primary" aria-hidden="true" />
            {block.title ?? 'Continue por aqui'}
          </p>
          <ul className="mt-4 space-y-3">
            {block.items.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group block rounded-xl border border-transparent bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <span className="flex items-center gap-1.5 text-[14.5px] font-semibold text-zinc-900 group-hover:text-primary">
                    {link.label}
                    <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-zinc-600">
                    {link.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )

    case 'summary':
      return (
        <aside aria-label="Resumo executivo" className="rounded-2xl bg-zinc-950 p-5 text-zinc-100 sm:p-6">
          <p className="flex items-center gap-2 text-[13px] font-bold tracking-wide text-white uppercase">
            <BookOpen className="size-4 text-orange-400" aria-hidden="true" />
            Resumo executivo
          </p>
          <ul className="mt-3 space-y-2">
            {block.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-zinc-300">
                <Check className="mt-1 size-4 shrink-0 text-orange-400" aria-hidden="true" />
                <span>
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ul>
        </aside>
      )

    default: {
      const exhaustive: never = block
      return exhaustive
    }
  }
}

export function ArticleRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-7">
      {blocks.map((block, i) => (
        <BlockView key={`${block.type}-${i}`} block={block} />
      ))}
    </div>
  )
}
