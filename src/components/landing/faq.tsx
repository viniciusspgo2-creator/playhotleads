'use client'

// src/components/landing/faq.tsx
// FAQ com Accordion do shadcn/ui. Respostas honestas — o tom sênior do produto.
// Os DADOS vivem em '@/content/faq-landing' (server-safe) — este arquivo é só
// o componente client. O JSON-LD da home consome o MESMO dataset (fonte única).

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { LANDING_FAQ } from '@/content/faq-landing'

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
            Perguntas frequentes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            O que você ia perguntar no call
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10">
          {LANDING_FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="border-zinc-200">
              <AccordionTrigger className="text-left text-[15px] font-semibold text-zinc-900 hover:text-primary hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14px] leading-relaxed text-zinc-600">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
