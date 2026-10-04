'use client'

// src/components/landing/navbar.tsx
// Header fixo da landing — links de âncora + CTA. Menu mobile via Sheet.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Menu, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const NAV_LINKS = [
  { href: '#demo', label: 'Demonstração' },
  { href: '#fontes', label: 'Fontes' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
] as const

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // Sombra no header quando a página rola — feedback visual de "flutuando"
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-shadow duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md shadow-[0_1px_0_0_oklch(0.922_0_0),0_8px_24px_-16px_oklch(0.145_0_0/0.25)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Play Hot Leads — início"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-orange-600/25">
            <Flame className="size-5" aria-hidden="true" />
          </span>
          <span className="text-[17px] font-bold tracking-tight text-zinc-900">
            Play<span className="text-primary"> Hot Leads</span>
          </span>
        </Link>

        {/* Links desktop */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden rounded-full px-5 font-semibold shadow-lg shadow-orange-600/25 sm:inline-flex"
          >
            <a href="#/app" data-cta="navbar-open-app">
              Abrir o app
              <ArrowRight className="ml-1 size-4" aria-hidden="true" />
            </a>
          </Button>

          {/* Menu mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Flame className="size-4" aria-hidden="true" />
                  </span>
                  Play Hot Leads
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Navegação mobile" className="mt-2 flex flex-col px-4">
                {NAV_LINKS.map((link) =>
                  link.href.startsWith('/') ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      {link.label}
                    </a>
                  ),
                )}
                <Separator className="my-3" />
                <Button asChild className="rounded-full font-semibold">
                  <a href="#/app" onClick={() => setOpen(false)}>
                    Abrir o app
                    <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                  </a>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
