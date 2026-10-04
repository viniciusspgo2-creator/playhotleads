'use client'

// src/components/master/master-view.tsx
// Painel Master — SPA administrativa standalone (aberta pelo hash #/master
// via ViewManager, que passa visible). Layout próprio: topbar (logo +
// sessão) e sidebar vertical (md+) / pills horizontais (mobile). Seções
// ficam MONTADAS com display-swap para preservar estado. Todas as chamadas
// passam por apiFetch (x-tenant-id + x-session-token) e as rotas
// /api/master/* exigem role master no server.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  CreditCard,
  Flame,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings2,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { apiFetch, clearSessionToken } from '@/lib/tenant-client'
import { Toaster } from '@/components/ui/sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  AppConfigDTO,
  AppConfigSecretsMasked,
  MasterOverviewDTO,
  MasterUserRow,
  PaymentDTO,
  PaymentGateway,
  PaymentStatus,
  PlanDTO,
  UserDTO,
  UserRole,
  UserStatus,
} from '@/core/types'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type MasterSection = 'overview' | 'users' | 'plans' | 'payments' | 'config'

const PAGE_SIZE = 20

const brl = (cents: number): string =>
  Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })

const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'pago', className: 'border-transparent bg-emerald-100 text-emerald-700' },
  pending: { label: 'pendente', className: 'border-transparent bg-amber-100 text-amber-700' },
  failed: { label: 'falhou', className: 'border-transparent bg-red-100 text-red-700' },
  expired: { label: 'expirado', className: 'border-transparent bg-zinc-100 text-zinc-600' },
}

const GATEWAY_LABEL: Record<PaymentGateway, string> = {
  mercadopago: 'Mercado Pago',
  asaas: 'Asaas',
  demo: 'Demo',
  manual: 'Manual',
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status]
  return <Badge className={meta.className}>{meta.label}</Badge>
}

function GatewayBadge({ gateway }: { gateway: PaymentGateway }) {
  return (
    <Badge variant="outline" className="bg-zinc-50 text-[11px] text-zinc-500">
      {GATEWAY_LABEL[gateway]}
    </Badge>
  )
}

function LoadingBlock({ label = 'carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-400" role="status">
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <span className="text-[13px]">{label}</span>
    </div>
  )
}

function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-14 text-center">
      <p className="text-[13.5px] font-medium text-zinc-500">{title}</p>
      {hint ? <p className="max-w-sm text-[12.5px] text-zinc-400">{hint}</p> : null}
    </div>
  )
}

function Pager({
  page,
  pageSize,
  total,
  onPrev,
  onNext,
}: {
  page: number
  pageSize: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-[12.5px] text-zinc-500">
        {total} registro{total === 1 ? '' : 's'} · página {page} de {pages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={page >= pages}>
          Próxima
        </Button>
      </div>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-zinc-900" title={value}>
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-[12px] text-zinc-400">{hint}</p> : null}
    </div>
  )
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
  )
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-[13.5px] text-zinc-500">Não foi possível carregar os dados.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Tentar novamente
      </Button>
    </div>
  )
}

/**
 * Carrega na PRIMEIRA abertura da seção (display-swap) e a cada mudança de
 * paginação/filtro (quando `load` muda) — revisitar a seção NÃO recarrega,
 * preservando o estado montado. Visão geral usa o padrão simples
 * (recarrega em toda abertura) direto no componente.
 */
function useLoadOnOpen(visible: boolean, load: () => void | Promise<void>): void {
  const everOpenedRef = useRef(false)
  const prevVisibleRef = useRef(visible)
  const prevLoadRef = useRef(load)

  useEffect(() => {
    const visibleChanged = prevVisibleRef.current !== visible
    const loadChanged = prevLoadRef.current !== load
    prevVisibleRef.current = visible
    prevLoadRef.current = load

    if (!visible) return
    if (!everOpenedRef.current && visibleChanged) {
      everOpenedRef.current = true
      void load()
      return
    }
    if (loadChanged) void load()
  }, [visible, load])
}

/* ------------------------------------------------------------------ */
/* MasterView — shell                                                  */
/* ------------------------------------------------------------------ */

const NAV: { id: MasterSection; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'plans', label: 'Planos', icon: CreditCard },
  { id: 'payments', label: 'Pagamentos', icon: ReceiptText },
  { id: 'config', label: 'Configurações', icon: Settings2 },
]

export function MasterView({ visible = true }: { visible?: boolean }) {
  const [authState, setAuthState] = useState<'loading' | 'ok' | 'deny'>('loading')
  const [me, setMe] = useState<UserDTO | null>(null)
  const [section, setSection] = useState<MasterSection>('overview')

  useEffect(() => {
    if (!visible) return
    let alive = true
    const run = async () => {
      try {
        const res = await apiFetch('/api/auth/me')
        if (!res.ok) {
          if (alive) setAuthState('deny')
          return
        }
        const json = (await res.json()) as { user: UserDTO }
        if (!alive) return
        if (json.user.role !== 'master') {
          setAuthState('deny')
          return
        }
        setMe(json.user)
        setAuthState('ok')
      } catch {
        if (alive) setAuthState('deny')
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [visible])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // segue — limpa o lado client de qualquer forma
    }
    clearSessionToken()
    window.location.hash = ''
  }, [])

  if (authState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50">
        <Loader2 className="size-7 animate-spin text-zinc-400" aria-hidden="true" />
        <p className="text-[13px] text-zinc-400">carregando painel…</p>
      </div>
    )
  }

  if (authState === 'deny' || !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Flame className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">Painel Master</h1>
          <p className="mt-1 max-w-sm text-[13.5px] text-zinc-500">
            Acesso restrito. Faça login com uma conta master para gerenciar usuários, planos,
            pagamentos e a configuração do SaaS.
          </p>
        </div>
        <Button asChild>
          <a href="#/app">Ir para o login</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Toaster position="top-center" richColors closeButton />

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-zinc-900">
              Painel <span className="text-primary">Master</span>
            </p>
            <p className="hidden truncate text-[11.5px] text-zinc-400 sm:block">
              {me.name} · {me.email}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href="#/app">App</a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-zinc-500 hover:text-zinc-900"
              onClick={() => void logout()}
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar (md+) */}
        <aside className="hidden w-52 shrink-0 md:block" aria-label="Navegação do painel">
          <nav className="sticky top-20 flex flex-col gap-1">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                aria-current={section === id ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] font-medium transition-colors ${
                  section === id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-zinc-600 hover:bg-white hover:text-zinc-900'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">
          {/* Nav pills (mobile) */}
          <nav
            aria-label="Navegação do painel (mobile)"
            className="mb-4 flex gap-1.5 overflow-x-auto pb-1 md:hidden scrollbar-slim"
          >
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                aria-current={section === id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  section === id
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-zinc-200 bg-white text-zinc-600'
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          {/* Seções montadas — display swap preserva estado */}
          <div style={{ display: section === 'overview' ? 'block' : 'none' }}>
            <OverviewSection visible={section === 'overview'} />
          </div>
          <div style={{ display: section === 'users' ? 'block' : 'none' }}>
            <UsersSection visible={section === 'users'} />
          </div>
          <div style={{ display: section === 'plans' ? 'block' : 'none' }}>
            <PlansSection visible={section === 'plans'} />
          </div>
          <div style={{ display: section === 'payments' ? 'block' : 'none' }}>
            <PaymentsSection visible={section === 'payments'} />
          </div>
          <div style={{ display: section === 'config' ? 'block' : 'none' }}>
            <ConfigSection visible={section === 'config'} />
          </div>
        </main>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visão geral                                                         */
/* ------------------------------------------------------------------ */

function OverviewSection({ visible }: { visible: boolean }) {
  const [data, setData] = useState<MasterOverviewDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await apiFetch('/api/master/overview')
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as { overview: MasterOverviewDTO }
      setData(json.overview)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Visão geral recarrega em TODA abertura da seção.
  useEffect(() => {
    if (visible) void load()
  }, [visible, load])

  if (!data) {
    return loading ? <LoadingBlock /> : failed ? <ErrorBox onRetry={() => void load()} /> : null
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Usuários"
          value={String(data.users.total)}
          hint={`${data.users.newLast7d} novos em 7d · ${data.users.blocked} bloqueados`}
        />
        <StatCard
          label="Receita total"
          value={brl(data.revenue.totalCents)}
          hint={`${data.revenue.paidCount} pagamento(s) pago(s)`}
        />
        <StatCard label="Receita 30 dias" value={brl(data.revenue.last30dCents)} />
        <StatCard label="Pendente R$" value={brl(data.revenue.pendingCents)} />
        <StatCard
          label="Buscas 24h"
          value={String(data.searches.last24h)}
          hint={`${data.searches.total} no total`}
        />
        <StatCard label="Leads totais" value={String(data.leads.total)} />
        <StatCard label="Créditos em circulação" value={String(data.users.outstandingCredits)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Últimos pagamentos */}
        <SectionCard>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[14.5px] font-semibold text-zinc-900">Últimos pagamentos</h2>
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => void load()}>
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Atualizar
            </Button>
          </div>
          {data.recentPayments.length === 0 ? (
            <EmptyBlock title="Nenhum pagamento ainda" hint="Cobranças aparecem aqui em tempo real." />
          ) : (
            <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto scrollbar-slim">
              {data.recentPayments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-800">
                      {p.planName} · {p.credits} créditos
                    </p>
                    <p className="truncate text-[12px] text-zinc-400">{p.userEmail ?? p.userId}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-zinc-800">
                    {brl(p.amountCents)}
                  </span>
                  <PaymentStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Novos usuários */}
        <SectionCard>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[14.5px] font-semibold text-zinc-900">Novos usuários</h2>
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => void load()}>
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Atualizar
            </Button>
          </div>
          {data.recentUsers.length === 0 ? (
            <EmptyBlock title="Nenhum usuário cadastrado" hint="Registros de signup aparecem aqui." />
          ) : (
            <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto scrollbar-slim">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-800">{u.name}</p>
                    <p className="truncate text-[12px] text-zinc-400">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-zinc-400">{fmtDate(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

interface UserFormState {
  name: string
  email: string
  credits: string
  planId: string // 'none' | id do plano
  status: UserStatus
  role: UserRole
  newPassword: string
}

const EMPTY_USER_FORM: UserFormState = {
  name: '',
  email: '',
  credits: '0',
  planId: 'none',
  status: 'active',
  role: 'user',
  newPassword: '',
}

function UsersSection({ visible }: { visible: boolean }) {
  const [inputQ, setInputQ] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<MasterUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const [plans, setPlans] = useState<PlanDTO[]>([])
  const [editing, setEditing] = useState<MasterUserRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Busca com debounce de 400ms → reinicia paginação.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(inputQ.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [inputQ])

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (q) params.set('q', q)
      const res = await apiFetch(`/api/master/users?${params.toString()}`)
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as { rows: MasterUserRow[]; total: number }
      setRows(json.rows)
      setTotal(json.total)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [page, q])

  useLoadOnOpen(visible, load)

  const loadPlans = useCallback(async () => {
    try {
      const res = await apiFetch('/api/master/plans')
      if (!res.ok) return
      const json = (await res.json()) as { plans: PlanDTO[] }
      setPlans(json.plans)
    } catch {
      // select de plano simplesmente fica vazio
    }
  }, [])

  const openEdit = (u: MasterUserRow) => {
    setEditing(u)
    setForm({
      name: u.name,
      email: u.email,
      credits: String(u.credits),
      planId: u.planId ?? 'none',
      status: u.status,
      role: u.role,
      newPassword: '',
    })
    setDialogOpen(true)
    if (plans.length === 0) void loadPlans()
  }

  const saveEdit = async () => {
    if (!editing) return
    const payload: Record<string, unknown> = {}
    const name = form.name.trim()
    const email = form.email.trim()
    if (name !== editing.name) payload.name = name
    if (email !== editing.email) payload.email = email
    const credits = Number.parseInt(form.credits, 10)
    if (Number.isFinite(credits) && credits !== editing.credits) payload.credits = credits
    const planId = form.planId === 'none' ? null : form.planId
    if (planId !== editing.planId) payload.planId = planId
    if (form.status !== editing.status) payload.status = form.status
    if (form.role !== editing.role) payload.role = form.role
    if (form.newPassword) payload.newPassword = form.newPassword

    if (Object.keys(payload).length === 0) {
      setDialogOpen(false)
      return
    }

    setSaving(true)
    try {
      const res = await apiFetch(`/api/master/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'não foi possível salvar o usuário')
        return
      }
      toast.success('usuário atualizado')
      setDialogOpen(false)
      await load()
    } catch {
      toast.error('erro de rede ao salvar o usuário')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (u: MasterUserRow) => {
    const next: UserStatus = u.status === 'active' ? 'blocked' : 'active'
    setBusyId(u.id)
    try {
      const res = await apiFetch(`/api/master/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'ação não permitida')
        return
      }
      toast.success(next === 'blocked' ? 'usuário bloqueado' : 'usuário reativado')
      await load()
    } catch {
      toast.error('erro de rede')
    } finally {
      setBusyId(null)
    }
  }

  const removeUser = async (u: MasterUserRow) => {
    if (!window.confirm(`Excluir "${u.name}" e todos os dados do workspace? Essa ação é irreversível.`)) {
      return
    }
    setBusyId(u.id)
    try {
      const res = await apiFetch(`/api/master/users/${u.id}`, { method: 'DELETE' })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'não foi possível excluir')
        return
      }
      toast.success('usuário excluído')
      await load()
    } catch {
      toast.error('erro de rede')
    } finally {
      setBusyId(null)
    }
  }

  const userActions = (u: MasterUserRow) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="outline" size="sm" onClick={() => openEdit(u)} disabled={busyId === u.id}>
        <Pencil className="size-3.5" aria-hidden="true" />
        Editar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={u.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
        onClick={() => void toggleStatus(u)}
        disabled={busyId === u.id}
      >
        {u.status === 'active' ? (
          <Ban className="size-3.5" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
        )}
        {u.status === 'active' ? 'Bloquear' : 'Ativar'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-600"
        onClick={() => void removeUser(u)}
        disabled={busyId === u.id || u.role === 'master'}
        title={u.role === 'master' ? 'conta master não pode ser excluída por aqui' : 'excluir usuário'}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Excluir
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          aria-label="Buscar usuários"
          className="h-9 max-w-xs rounded-xl bg-white"
        />
        {loading ? <Loader2 className="size-4 animate-spin text-zinc-400" aria-hidden="true" /> : null}
      </div>

      {failed ? (
        <SectionCard>
          <ErrorBox onRetry={() => void load()} />
        </SectionCard>
      ) : rows.length === 0 && !loading ? (
        <SectionCard>
          <EmptyBlock title="Nenhum usuário encontrado" hint="Ajuste a busca ou aguarde novos cadastros." />
        </SectionCard>
      ) : (
        <>
          {/* Tabela (md+) */}
          <div className="hidden max-h-[560px] overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-sm md:block scrollbar-slim [&_[data-slot=table-container]]:overflow-x-visible">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_theme(colors.zinc.200)]">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Uso</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="max-w-44 truncate font-medium text-zinc-900" title={u.name}>
                        {u.name}
                      </p>
                      <p className="max-w-44 truncate text-[12px] text-zinc-400" title={u.email}>
                        {u.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      {u.role === 'master' ? (
                        <Badge className="border-transparent bg-primary text-primary-foreground">master</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
                          usuário
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.status === 'active' ? (
                        <Badge className="border-transparent bg-emerald-100 text-emerald-700">ativo</Badge>
                      ) : (
                        <Badge className="border-transparent bg-red-100 text-red-700">bloqueado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{u.credits}</TableCell>
                    <TableCell className="text-[13px] text-zinc-500">{u.planName ?? '—'}</TableCell>
                    <TableCell className="text-right text-[13px] tabular-nums text-zinc-500">
                      {u.searchesCount} / {u.leadsCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-zinc-500">
                      {fmtDate(u.createdAt)}
                    </TableCell>
                    <TableCell>{userActions(u)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Cards (mobile) */}
          <div className="space-y-3 md:hidden">
            {rows.map((u) => (
              <div key={u.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-zinc-900">{u.name}</p>
                    <p className="truncate text-[12.5px] text-zinc-400">{u.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {u.role === 'master' ? (
                      <Badge className="border-transparent bg-primary text-primary-foreground">master</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
                        usuário
                      </Badge>
                    )}
                    {u.status === 'active' ? (
                      <Badge className="border-transparent bg-emerald-100 text-emerald-700">ativo</Badge>
                    ) : (
                      <Badge className="border-transparent bg-red-100 text-red-700">bloqueado</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px] text-zinc-500">
                  <p>
                    Créditos: <span className="font-semibold text-zinc-800">{u.credits}</span>
                  </p>
                  <p>
                    Plano: <span className="font-semibold text-zinc-800">{u.planName ?? '—'}</span>
                  </p>
                  <p>
                    Uso:{' '}
                    <span className="font-semibold text-zinc-800">
                      {u.searchesCount} buscas / {u.leadsCount} leads
                    </span>
                  </p>
                  <p>
                    Criado: <span className="font-semibold text-zinc-800">{fmtDate(u.createdAt)}</span>
                  </p>
                </div>
                <div className="mt-3 border-t border-zinc-100 pt-3">{userActions(u)}</div>
              </div>
            ))}
          </div>

          <Pager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      {/* Dialog de edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-slim sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>
              {editing ? `${editing.email} · criado em ${fmtDateTime(editing.createdAt)}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="mu-name">Nome</Label>
              <Input
                id="mu-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={80}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mu-email">E-mail</Label>
              <Input
                id="mu-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="mu-credits">Créditos</Label>
                <Input
                  id="mu-credits"
                  type="number"
                  min={0}
                  max={1000000}
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Plano</Label>
                <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                  <SelectTrigger aria-label="Plano do usuário">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">sem plano</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as UserStatus })}
                >
                  <SelectTrigger aria-label="Status do usuário">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">ativo</SelectItem>
                    <SelectItem value="blocked">bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Papel</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger aria-label="Papel do usuário">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">usuário</SelectItem>
                    <SelectItem value="master">master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mu-pass">Nova senha</Label>
              <Input
                id="mu-pass"
                type="password"
                placeholder="deixe vazio p/ manter"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
          </div>

          <DialogFooter className="mt-1">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveEdit()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Planos                                                              */
/* ------------------------------------------------------------------ */

interface PlanFormState {
  name: string
  price: string
  credits: string
  featuresText: string
  active: boolean
  highlight: boolean
  sortOrder: string
}

const EMPTY_PLAN_FORM: PlanFormState = {
  name: '',
  price: '0,00',
  credits: '0',
  featuresText: '',
  active: true,
  highlight: false,
  sortOrder: '0',
}

function priceToCents(v: string): number {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0
}

const centsToPriceInput = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',')

function PlansSection({ visible }: { visible: boolean }) {
  const [plans, setPlans] = useState<PlanDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanFormState>(EMPTY_PLAN_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await apiFetch('/api/master/plans')
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as { plans: PlanDTO[] }
      setPlans(json.plans)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useLoadOnOpen(visible, load)

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_PLAN_FORM)
    setDialogOpen(true)
  }

  const openEdit = (p: PlanDTO) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      price: centsToPriceInput(p.priceCents),
      credits: String(p.credits),
      featuresText: p.features.join('\n'),
      active: p.active,
      highlight: p.highlight,
      sortOrder: String(p.sortOrder),
    })
    setDialogOpen(true)
  }

  const savePlan = async () => {
    const name = form.name.trim()
    if (name.length < 2) {
      toast.error('informe um nome com pelo menos 2 caracteres')
      return
    }
    const features = form.featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8)

    const body: Record<string, unknown> = {
      name,
      priceCents: priceToCents(form.price),
      credits: Math.max(0, Number.parseInt(form.credits, 10) || 0),
      features,
      active: form.active,
      highlight: form.highlight,
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    }

    setSaving(true)
    try {
      const res = await apiFetch(editingId ? `/api/master/plans/${editingId}` : '/api/master/plans', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'não foi possível salvar o plano')
        return
      }
      toast.success(editingId ? 'plano atualizado' : 'plano criado')
      setDialogOpen(false)
      await load()
    } catch {
      toast.error('erro de rede ao salvar o plano')
    } finally {
      setSaving(false)
    }
  }

  const deletePlan = async () => {
    if (!editingId) return
    if (!window.confirm('Excluir este plano? Se ele estiver em uso, a exclusão será recusada.')) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/master/plans/${editingId}`, { method: 'DELETE' })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'não foi possível excluir o plano')
        return
      }
      toast.success('plano excluído')
      setDialogOpen(false)
      await load()
    } catch {
      toast.error('erro de rede')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900">Planos</h2>
          <p className="text-[12.5px] text-zinc-400">Catálogo exibido no checkout e na landing.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Novo plano
        </Button>
      </div>

      {loading && plans.length === 0 ? (
        <LoadingBlock />
      ) : failed && plans.length === 0 ? (
        <SectionCard>
          <ErrorBox onRetry={() => void load()} />
        </SectionCard>
      ) : plans.length === 0 ? (
        <SectionCard>
          <EmptyBlock
            title="Nenhum plano cadastrado"
            hint="Crie o primeiro plano para habilitar o checkout."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                p.highlight ? 'border-primary/60 ring-1 ring-primary/30' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-zinc-900">{p.name}</h3>
                <div className="flex shrink-0 gap-1.5">
                  {p.highlight ? (
                    <Badge className="border-transparent bg-primary text-primary-foreground">destaque</Badge>
                  ) : null}
                  {p.active ? (
                    <Badge className="border-transparent bg-emerald-100 text-emerald-700">ativo</Badge>
                  ) : (
                    <Badge className="border-transparent bg-zinc-100 text-zinc-600">inativo</Badge>
                  )}
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {brl(p.priceCents)}
                <span className="ml-1 text-[12px] font-medium text-zinc-400">/mês</span>
              </p>
              <p className="mt-0.5 text-[12.5px] text-zinc-500">{p.credits} créditos por contrato</p>
              {p.features.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-[13px] text-zinc-600">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0">{f}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 flex justify-end border-t border-zinc-100 pt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-slim sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar plano' : 'Novo plano'}</DialogTitle>
            <DialogDescription>
              Preço em reais (use vírgula como decimal). Features: uma por linha (máx. 8).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="mp-name">Nome</Label>
              <Input
                id="mp-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={40}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="mp-price">Preço em R$</Label>
                <Input
                  id="mp-price"
                  inputMode="decimal"
                  placeholder="97,00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mp-credits">Créditos</Label>
                <Input
                  id="mp-credits"
                  type="number"
                  min={0}
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mp-features">Features (uma por linha)</Label>
              <Textarea
                id="mp-features"
                rows={5}
                placeholder={'5.000 créditos\nTodas as fontes + BYOK\nSuporte prioritário'}
                value={form.featuresText}
                onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                className="scrollbar-slim"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5">
                <Label htmlFor="mp-active" className="text-[13px]">
                  Ativo
                </Label>
                <Switch
                  id="mp-active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5">
                <Label htmlFor="mp-highlight" className="text-[13px]">
                  Destaque
                </Label>
                <Switch
                  id="mp-highlight"
                  checked={form.highlight}
                  onCheckedChange={(v) => setForm({ ...form, highlight: v })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mp-sort">Ordem de exibição</Label>
              <Input
                id="mp-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="mt-1 gap-2 sm:justify-between">
            {editingId ? (
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={() => void deletePlan()}
                disabled={deleting || saving}
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => void savePlan()} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pagamentos                                                          */
/* ------------------------------------------------------------------ */

function PaymentsSection({ visible }: { visible: boolean }) {
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [inputQ, setInputQ] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<PaymentDTO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(inputQ.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [inputQ])

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (q) params.set('q', q)
      const res = await apiFetch(`/api/master/payments?${params.toString()}`)
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as { rows: PaymentDTO[]; total: number }
      setRows(json.rows)
      setTotal(json.total)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [page, q, statusFilter])

  useLoadOnOpen(visible, load)

  const act = async (p: PaymentDTO, action: 'approve' | 'fail') => {
    setBusyId(p.id)
    try {
      const res = await apiFetch(`/api/master/payments/${p.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'ação não permitida')
        return
      }
      if (action === 'approve') toast.success('pagamento aprovado + créditos concedidos')
      else toast.success('pagamento marcado como falhou')
      await load()
    } catch {
      toast.error('erro de rede')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as 'all' | PaymentStatus)
            setPage(1)
          }}
        >
          <SelectTrigger aria-label="Filtrar por status" className="h-9 w-44 rounded-xl bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="failed">Falhados</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="Buscar por usuário (nome/e-mail)…"
          aria-label="Buscar pagamentos por usuário"
          className="h-9 max-w-xs rounded-xl bg-white"
        />
        {loading ? <Loader2 className="size-4 animate-spin text-zinc-400" aria-hidden="true" /> : null}
      </div>

      {failed ? (
        <SectionCard>
          <ErrorBox onRetry={() => void load()} />
        </SectionCard>
      ) : rows.length === 0 && !loading ? (
        <SectionCard>
          <EmptyBlock
            title="Nenhum pagamento encontrado"
            hint="Ajuste os filtros ou aguarde novas cobranças."
          />
        </SectionCard>
      ) : (
        <>
          <div className="space-y-2.5">
            {rows.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-40 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-zinc-900">
                    {p.planName} · {p.credits} créditos
                  </p>
                  <p className="truncate text-[12.5px] text-zinc-400">{p.userEmail ?? p.userId}</p>
                  <p className="mt-0.5 text-[11.5px] text-zinc-400">
                    {fmtDateTime(p.createdAt)}
                    {p.paidAt ? ` · pago em ${fmtDateTime(p.paidAt)}` : ''}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-1">
                  <span className="text-[14px] font-bold tabular-nums text-zinc-900">
                    {brl(p.amountCents)}
                  </span>
                  <span className="text-[11.5px] text-zinc-400">{p.method}</span>
                </div>

                <div className="flex flex-col items-start gap-1">
                  <GatewayBadge gateway={p.gateway} />
                  <PaymentStatusBadge status={p.status} />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {p.status !== 'paid' ? (
                    <Button size="sm" onClick={() => void act(p, 'approve')} disabled={busyId === p.id}>
                      {busyId === p.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      )}
                      Aprovar
                    </Button>
                  ) : null}
                  {p.status === 'pending' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => void act(p, 'fail')}
                      disabled={busyId === p.id}
                    >
                      <Ban className="size-3.5" aria-hidden="true" />
                      Falhar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <Pager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

interface ConfigFormState {
  brandName: string
  defaultFreeCredits: string
  creditMode: 'per_lead' | 'per_search'
  costPerSearch: string
  maxLeadsPerSearch: string
  allowedLimits: string
  signupEnabled: boolean
  maintenance: boolean
  publicUrl: string
  mercadopagoEnabled: boolean
  mercadopagoToken: string
  asaasEnabled: boolean
  asaasSandbox: boolean
  asaasApiKey: string
}

function ConfigSection({ visible }: { visible: boolean }) {
  const [form, setForm] = useState<ConfigFormState | null>(null)
  const [secrets, setSecrets] = useState<AppConfigSecretsMasked | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await apiFetch('/api/master/config')
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as { config: AppConfigDTO; secrets: AppConfigSecretsMasked }
      setSecrets(json.secrets)
      setForm({
        brandName: json.config.brandName,
        defaultFreeCredits: String(json.config.defaultFreeCredits),
        creditMode: json.config.creditMode,
        costPerSearch: String(json.config.costPerSearch),
        maxLeadsPerSearch: String(json.config.maxLeadsPerSearch),
        allowedLimits: json.config.allowedLimits.join(', '),
        signupEnabled: json.config.signupEnabled,
        maintenance: json.config.maintenance,
        publicUrl: json.config.publicUrl,
        mercadopagoEnabled: json.config.mercadopagoEnabled,
        mercadopagoToken: '',
        asaasEnabled: json.config.asaasEnabled,
        asaasSandbox: json.config.asaasSandbox,
        asaasApiKey: '',
      })
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useLoadOnOpen(visible, load)

  const save = async () => {
    if (!form) return
    const configPayload: Record<string, unknown> = {
      brandName: form.brandName.trim(),
      defaultFreeCredits: Math.max(0, Number.parseInt(form.defaultFreeCredits, 10) || 0),
      creditMode: form.creditMode,
      costPerSearch: Math.max(1, Number.parseInt(form.costPerSearch, 10) || 1),
      maxLeadsPerSearch: Math.max(10, Number.parseInt(form.maxLeadsPerSearch, 10) || 300),
      allowedLimits: form.allowedLimits
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n)),
      signupEnabled: form.signupEnabled,
      maintenance: form.maintenance,
      publicUrl: form.publicUrl.trim(),
      mercadopagoEnabled: form.mercadopagoEnabled,
      asaasEnabled: form.asaasEnabled,
      asaasSandbox: form.asaasSandbox,
    }

    const secretsPayload: Record<string, string> = {}
    if (form.mercadopagoToken.trim()) secretsPayload.mercadopagoToken = form.mercadopagoToken.trim()
    if (form.asaasApiKey.trim()) secretsPayload.asaasApiKey = form.asaasApiKey.trim()

    setSaving(true)
    try {
      const res = await apiFetch('/api/master/config', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ config: configPayload, secrets: secretsPayload }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'não foi possível salvar a configuração')
        return
      }
      toast.success('configuração salva')
      // recarrega estado sanitizado + máscaras atualizadas
      await load()
    } catch {
      toast.error('erro de rede ao salvar a configuração')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return loading ? (
      <LoadingBlock />
    ) : failed ? (
      <SectionCard>
        <ErrorBox onRetry={() => void load()} />
      </SectionCard>
    ) : null
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-zinc-900">Configurações do SaaS</h2>
        <p className="text-[12.5px] text-zinc-400">
          Aplicam-se a toda a plataforma — créditos, limites, gateways e modo de operação.
        </p>
      </div>

      {/* Marca e créditos */}
      <SectionCard className="space-y-4">
        <h3 className="text-[13.5px] font-semibold text-zinc-700">Marca e créditos</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="cf-brand">Nome da marca</Label>
            <Input
              id="cf-brand"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              maxLength={40}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cf-free">Créditos grátis de boas-vindas</Label>
            <Input
              id="cf-free"
              type="number"
              min={0}
              value={form.defaultFreeCredits}
              onChange={(e) => setForm({ ...form, defaultFreeCredits: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Modo de cobrança de crédito</Label>
            <Select
              value={form.creditMode}
              onValueChange={(v) => setForm({ ...form, creditMode: v as ConfigFormState['creditMode'] })}
            >
              <SelectTrigger aria-label="Modo de cobrança">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_lead">1 crédito por lead entregue</SelectItem>
                <SelectItem value="per_search">custo fixo por busca</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.creditMode === 'per_search' ? (
            <div className="grid gap-1.5">
              <Label htmlFor="cf-cost">Custo por busca (créditos)</Label>
              <Input
                id="cf-cost"
                type="number"
                min={1}
                value={form.costPerSearch}
                onChange={(e) => setForm({ ...form, costPerSearch: e.target.value })}
              />
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="cf-max">Máx. leads por busca</Label>
            <Input
              id="cf-max"
              type="number"
              min={10}
              max={1000}
              value={form.maxLeadsPerSearch}
              onChange={(e) => setForm({ ...form, maxLeadsPerSearch: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cf-limits">Limites permitidos (separados por vírgula)</Label>
            <Input
              id="cf-limits"
              inputMode="numeric"
              placeholder="30, 80, 150, 300"
              value={form.allowedLimits}
              onChange={(e) => setForm({ ...form, allowedLimits: e.target.value })}
            />
          </div>
        </div>
      </SectionCard>

      {/* Operação */}
      <SectionCard className="space-y-4">
        <h3 className="text-[13.5px] font-semibold text-zinc-700">Operação</h3>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
          <div>
            <Label htmlFor="cf-signup" className="text-[13.5px]">
              Cadastro aberto
            </Label>
            <p className="text-[12px] text-zinc-400">
              Novos visitantes podem criar conta com créditos grátis.
            </p>
          </div>
          <Switch
            id="cf-signup"
            checked={form.signupEnabled}
            onCheckedChange={(v) => setForm({ ...form, signupEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div>
            <Label htmlFor="cf-maintenance" className="text-[13.5px]">
              Modo manutenção
            </Label>
            <p className="text-[12px] text-amber-600">
              Bloqueia buscas e novas sessões para não-masters. Use com cuidado.
            </p>
          </div>
          <Switch
            id="cf-maintenance"
            checked={form.maintenance}
            onCheckedChange={(v) => setForm({ ...form, maintenance: v })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cf-url">URL pública do app</Label>
          <Input
            id="cf-url"
            placeholder="https://app.seudominio.com"
            value={form.publicUrl}
            onChange={(e) => setForm({ ...form, publicUrl: e.target.value })}
            maxLength={200}
          />
          <p className="text-[12px] text-zinc-400">Usada em webhooks e back_urls dos gateways de pagamento.</p>
        </div>
      </SectionCard>

      {/* Gateways */}
      <SectionCard className="space-y-4">
        <h3 className="text-[13.5px] font-semibold text-zinc-700">Gateways de pagamento</h3>
        <p className="-mt-2 text-[12.5px] text-zinc-400">
          Sem credencial de gateway o checkout roda em modo demonstração (aprovável na UI).
        </p>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
          <div>
            <Label htmlFor="cf-mp" className="text-[13.5px]">
              Mercado Pago
            </Label>
            <p className="text-[12px] text-zinc-400">
              {secrets?.mercadopagoTokenSet
                ? `credencial configurada (${secrets.mercadopagoTokenHint ?? 'ok'})`
                : 'nenhuma credencial salva'}
            </p>
          </div>
          <Switch
            id="cf-mp"
            checked={form.mercadopagoEnabled}
            onCheckedChange={(v) => setForm({ ...form, mercadopagoEnabled: v })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cf-mp-token">Token do Mercado Pago</Label>
          <Input
            id="cf-mp-token"
            type="password"
            placeholder={secrets?.mercadopagoTokenHint ?? 'cole seu token… (deixe vazio p/ manter)'}
            value={form.mercadopagoToken}
            onChange={(e) => setForm({ ...form, mercadopagoToken: e.target.value })}
            maxLength={300}
            autoComplete="off"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
          <div>
            <Label htmlFor="cf-asaas" className="text-[13.5px]">
              Asaas
            </Label>
            <p className="text-[12px] text-zinc-400">
              {secrets?.asaasApiKeySet
                ? `credencial configurada (${secrets.asaasApiKeyHint ?? 'ok'})`
                : 'nenhuma credencial salva'}
            </p>
          </div>
          <Switch
            id="cf-asaas"
            checked={form.asaasEnabled}
            onCheckedChange={(v) => setForm({ ...form, asaasEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
          <div>
            <Label htmlFor="cf-asaas-sb" className="text-[13.5px]">
              Sandbox do Asaas
            </Label>
            <p className="text-[12px] text-zinc-400">Usa api-sandbox.asaas.com em vez da produção.</p>
          </div>
          <Switch
            id="cf-asaas-sb"
            checked={form.asaasSandbox}
            onCheckedChange={(v) => setForm({ ...form, asaasSandbox: v })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cf-asaas-key">API key do Asaas</Label>
          <Input
            id="cf-asaas-key"
            type="password"
            placeholder={secrets?.asaasApiKeyHint ?? 'cole sua api key… (deixe vazio p/ manter)'}
            value={form.asaasApiKey}
            onChange={(e) => setForm({ ...form, asaasApiKey: e.target.value })}
            maxLength={300}
            autoComplete="off"
          />
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={() => void save()} disabled={saving} className="min-w-28">
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Salvar configuração
        </Button>
      </div>
    </div>
  )
}
