'use client'

// src/components/app/app-shell.tsx
// Shell do dashboard: auth gate (sessão SaaS), header com tabs (estado
// preservado entre abas — as views ficam montadas e só trocam de display),
// navbar com créditos/plano/logout, i18n e Sonner.

import { useState } from 'react'
import {
  Flame,
  Search,
  Users,
  LayoutGrid,
  MessageCircle,
  CreditCard,
  Coins,
  LogOut,
  ShieldCheck,
  Settings2,
  Languages,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LanguageProvider, useI18n, type Language } from './i18n'
import { AuthProvider, useAuth } from './auth-context'
import { AuthView } from './auth-view'
import { SearchView } from './search-view'
import { LeadsView } from './leads-view'
import { KanbanView } from './kanban-view'
import { CampaignsView } from './campaigns-view'
import { BillingView } from './billing-view'
import { SettingsView } from './settings-view'

export type AppTab = 'search' | 'leads' | 'kanban' | 'campaigns' | 'billing' | 'settings'

const TABS: { id: AppTab; icon: typeof Search; labelKey: string }[] = [
  { id: 'search', icon: Search, labelKey: 'tabs.search' },
  { id: 'leads', icon: Users, labelKey: 'tabs.leads' },
  { id: 'kanban', icon: LayoutGrid, labelKey: 'tabs.kanban' },
  { id: 'campaigns', icon: MessageCircle, labelKey: 'tabs.campaigns' },
  { id: 'billing', icon: CreditCard, labelKey: 'tabs.billing' },
  { id: 'settings', icon: Settings2, labelKey: 'tabs.settings' },
]

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: 'pt', label: 'PT-BR' },
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

/** Porta de entrada: loading → AuthView → Shell. */
function AuthGate() {
  const { t } = useI18n()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-50" role="status" aria-live="polite">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }
  if (!user) return <AuthView />
  return <Shell />
}

function Shell() {
  const { t, language, setLanguage } = useI18n()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<AppTab>('search')

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <a
            href="#"
            className="flex shrink-0 items-center gap-2"
            aria-label="Play Hot Leads"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden text-[15px] font-bold tracking-tight text-zinc-900 sm:inline">
              Play<span className="text-primary"> Hot Leads</span>
            </span>
          </a>

          {/* Tabs desktop */}
          <nav aria-label="Seções do app" className="mx-auto hidden items-center gap-1 md:flex">
            {TABS.map(({ id, icon: Icon, labelKey }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors ${
                  tab === id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {t(labelKey)}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {/* Créditos → abre Planos */}
            <button
              type="button"
              onClick={() => setTab('billing')}
              aria-label={t('tabs.billing')}
              title={t('tabs.billing')}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-bold tabular-nums text-zinc-800 transition-colors hover:border-orange-300 hover:bg-orange-50"
            >
              <Coins className="size-4 text-primary" aria-hidden="true" />
              {user?.credits ?? 0}
            </button>

            {/* Plano atual (some no mobile) */}
            <Badge
              variant="outline"
              className="hidden max-w-28 truncate rounded-full border-zinc-200 bg-zinc-100 px-2.5 text-[11.5px] font-semibold text-zinc-600 sm:inline-flex"
            >
              {user?.planName ?? t('billing.free')}
            </Badge>

            {/* Painel Master — só para role master */}
            {user?.role === 'master' && (
              <a
                href="#/master"
                title="Painel Master"
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                <span className="hidden lg:inline">Painel Master</span>
              </a>
            )}

            <Languages className="size-4 text-zinc-400" aria-hidden="true" />
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger aria-label="Idioma" className="h-8 w-[92px] rounded-full text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANG_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              aria-label={t('auth.logout')}
              title={t('auth.logout')}
              onClick={() => void logout()}
              className="size-8 rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Tabs mobile */}
        <nav aria-label="Seções do app (mobile)" className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden scrollbar-slim">
          {TABS.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                tab === id ? 'bg-primary text-primary-foreground' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {t(labelKey)}
            </button>
          ))}
        </nav>
      </header>

      {/* Views — montadas sempre, display trocado (preserva stream/polling) */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div style={{ display: tab === 'search' ? 'block' : 'none' }}>
          <SearchView visible={tab === 'search'} onGoTo={setTab} />
        </div>
        <div style={{ display: tab === 'leads' ? 'block' : 'none' }}>
          <LeadsView visible={tab === 'leads'} />
        </div>
        <div style={{ display: tab === 'kanban' ? 'block' : 'none' }}>
          <KanbanView visible={tab === 'kanban'} />
        </div>
        <div style={{ display: tab === 'campaigns' ? 'block' : 'none' }}>
          <CampaignsView visible={tab === 'campaigns'} />
        </div>
        <div style={{ display: tab === 'billing' ? 'block' : 'none' }}>
          <BillingView visible={tab === 'billing'} />
        </div>
        <div style={{ display: tab === 'settings' ? 'block' : 'none' }}>
          <SettingsView />
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-[12px] text-zinc-500">
            Play Hot Leads · workspace isolado por tenant
          </p>
          <Button asChild variant="ghost" className="h-7 rounded-full px-3 text-[12px] text-zinc-500">
            <a href="#">← voltar à landing</a>
          </Button>
        </div>
      </footer>
    </div>
  )
}

export function AppShell() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </LanguageProvider>
  )
}
