// src/components/landing/cta.tsx
// CTA final da landing. Server component.

import { Flame, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Cta() {
  return (
    <section className="bg-white pb-20 sm:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-6 py-16 text-center shadow-2xl shadow-orange-600/25 sm:px-12 sm:py-20">
          {/* Halos decorativos */}
          <div
            className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-white/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur">
              <Flame className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Pronto pra encher o pipeline hoje mesmo?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-orange-50">
              Crie sua conta, digite o seu nicho e veja os primeiros cards chegando em
              menos de um minuto. Sem cartão, sem compromisso.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-8 text-[15px] font-bold text-orange-700 shadow-xl transition-transform hover:scale-[1.03] hover:bg-orange-50"
              >
                <a href="#/app" data-cta="final-create-account">
                  Criar conta grátis
                  <ArrowRight className="ml-2 size-4.5" aria-hidden="true" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/40 bg-white/10 px-8 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
              >
                <a href="#demo">Rever a demonstração</a>
              </Button>
            </div>
            <p className="mt-6 flex items-center justify-center gap-1.5 text-[13px] font-medium text-orange-100/90">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Dados isolados por tenant · chaves criptografadas · cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
