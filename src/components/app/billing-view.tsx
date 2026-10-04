'use client'

// src/components/app/billing-view.tsx
// Camada SaaS do usuário: saldo de créditos, planos (GET /api/plans),
// checkout (POST /api/checkout) com duas vias — checkoutUrl real (abre em
// nova aba + polling de status a cada 3s até 2 min) ou gateway 'demo'
// (nota âmbar + botão de simulação) — e histórico de pagamentos.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  Coins,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/tenant-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from './auth-context'
import { useI18n, type Language } from './i18n'
import type { PaymentDTO, PaymentMethod, PaymentStatus, PlanDTO } from '@/core/types'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  mercadopago: 'Mercado Pago',
  credit_card: 'Cartão de crédito',
  asaas: 'Asaas',
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-zinc-200 text-zinc-600',
}

const METHOD_LOCALES: Record<Language, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
}

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 40 // 40 × 3s ≈ 2 min de espera máxima

interface CheckoutState {
  plan: PlanDTO
  phase: 'form' | 'waiting' | 'demo'
  payment: PaymentDTO | null
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  )
}

function formatDate(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(METHOD_LOCALES[language], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function priceLabel(plan: PlanDTO, freeLabel: string): string {
  return plan.priceCents === 0 ? freeLabel : formatBRL(plan.priceCents)
}

export function BillingView({ visible }: { visible: boolean }) {
  const { t, language } = useI18n()
  const { user, refresh } = useAuth()

  const [plans, setPlans] = useState<PlanDTO[] | null>(null)
  const [payments, setPayments] = useState<PaymentDTO[] | null>(null)
  const [checkout, setCheckout] = useState<CheckoutState | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [creating, setCreating] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadPlans = useCallback(async () => {
    try {
      const res = await apiFetch('/api/plans')
      if (!res.ok) return
      const data = (await res.json()) as { plans: PlanDTO[] }
      setPlans(data.plans)
    } catch {
      // silencioso — a grade mostra o estado vazio
    }
  }, [])

  const loadPayments = useCallback(async () => {
    try {
      const res = await apiFetch('/api/payments')
      if (!res.ok) return
      const data = (await res.json()) as { payments: PaymentDTO[] }
      setPayments(data.payments)
    } catch {
      // silencioso — histórico é nice-to-have
    }
  }, [])

  // Recarrega ao entrar na aba (a view fica montada com display swap)
  useEffect(() => {
    if (!visible) return
    void loadPlans()
    void loadPayments()
  }, [visible, loadPlans, loadPayments])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }, [refresh])

  function openCheckout(plan: PlanDTO): void {
    setMethod('pix')
    setCheckout({ plan, phase: 'form', payment: null })
  }

  const confirmCheckout = useCallback(async () => {
    if (!checkout || creating) return
    setCreating(true)
    try {
      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId: checkout.plan.id, method }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        payment?: PaymentDTO
        error?: string
      }
      if (!res.ok || !data.payment) {
        toast.error(data.error ?? t('common.error'))
        return
      }
      const payment = data.payment
      if (payment.checkoutUrl) {
        // gateway real: abre o checkout e passa a checar o status a cada 3s
        window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer')
        setCheckout((prev) => (prev ? { ...prev, phase: 'waiting', payment } : prev))
      } else if (payment.gateway === 'demo') {
        setCheckout((prev) => (prev ? { ...prev, phase: 'demo', payment } : prev))
      } else {
        // gateway configurado mas sem URL (ex.: manual) — fica aguardando
        setCheckout((prev) => (prev ? { ...prev, phase: 'waiting', payment } : prev))
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setCreating(false)
    }
  }, [checkout, creating, method, t])

  const finishPaid = useCallback(async () => {
    toast.success(t('billing.paid.toast'))
    setCheckout(null)
    await Promise.all([refresh(), loadPayments()])
  }, [t, refresh, loadPayments])

  const handlePollResult = useCallback(
    (payment: PaymentDTO) => {
      if (payment.status === 'paid') {
        void finishPaid()
        return
      }
      // pending mantém o polling; failed/expired desmontam o poll (status
      // !== 'pending' no gate de render) e ficam visíveis no diálogo
      setCheckout((prev) => (prev ? { ...prev, payment } : prev))
    },
    [finishPaid],
  )

  const simulatePayment = useCallback(async () => {
    const paymentId = checkout?.payment?.id
    if (!paymentId || simulating) return
    setSimulating(true)
    try {
      const res = await apiFetch(`/api/payments/${paymentId}/simulate`, { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as {
        payment?: PaymentDTO
        error?: string
      }
      if (!res.ok || !data.payment) {
        toast.error(data.error ?? t('common.error'))
        return
      }
      await finishPaid()
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSimulating(false)
    }
  }, [checkout, simulating, t, finishPaid])

  if (!user) return null

  const checkoutUrl = checkout?.payment?.checkoutUrl ?? null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      {/* -------- Coluna esquerda: saldo + planos -------- */}
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">{t('billing.title')}</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">{t('billing.subtitle')}</p>
        </div>

        {/* Saldo de créditos */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-1.5 text-[13.5px] font-bold text-zinc-900">
                <Coins className="size-4 text-primary" aria-hidden="true" />
                {t('billing.balance')}
              </h2>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                <span className="text-4xl font-extrabold tabular-nums text-zinc-900">
                  {user.credits}
                </span>
                <span className="flex flex-col">
                  <span className="text-[10.5px] uppercase tracking-wide text-zinc-400">
                    {t('billing.plan.current')}
                  </span>
                  <Badge className="mt-0.5 w-fit rounded-full bg-orange-100 text-orange-700">
                    {user.planName ?? t('billing.free')}
                  </Badge>
                </span>
              </div>
              <p className="mt-2 text-[12.5px] text-zinc-500">{t('billing.balance.helper')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="h-8 shrink-0 rounded-full"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {t('billing.refresh')}
            </Button>
          </div>
        </section>

        {/* Planos */}
        <section className="space-y-3">
          {plans === null ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
              <p className="text-[13px] text-zinc-500">{t('common.error')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${
                    plan.highlight ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {plan.highlight && (
                    <Badge className="absolute -top-2.5 right-4 rounded-full bg-primary text-primary-foreground shadow-sm">
                      {t('billing.popular')}
                    </Badge>
                  )}
                  <h3 className="text-[15px] font-bold text-zinc-900">{plan.name}</h3>
                  <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-zinc-900">
                    {priceLabel(plan, t('billing.free'))}
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-semibold text-primary">
                    +{plan.credits} {t('billing.credits')}
                  </p>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-zinc-600"
                      >
                        <Check
                          className="mt-0.5 size-3.5 shrink-0 text-emerald-500"
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => openCheckout(plan)}
                    className="mt-4 w-full rounded-xl font-semibold"
                  >
                    {t('billing.plan.contract')}
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* -------- Coluna direita: histórico de pagamentos -------- */}
      <aside>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-[13.5px] font-bold text-zinc-900">
            <CreditCard className="size-4 text-zinc-400" aria-hidden="true" />
            {t('billing.history')}
          </h2>

          {payments === null ? (
            <div className="mt-4 flex h-24 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : payments.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-zinc-500">{t('billing.empty')}</p>
          ) : (
            <ul className="mt-3 max-h-96 divide-y divide-zinc-100 overflow-y-auto scrollbar-slim">
              {payments.map((payment) => (
                <li key={payment.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-zinc-800">
                      {payment.planName}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-zinc-500">
                      {formatDate(payment.createdAt, language)} · {METHOD_LABELS[payment.method]}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold tabular-nums text-zinc-900">
                      {formatBRL(payment.amountCents)}
                    </p>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      {/* -------- Diálogo de checkout -------- */}
      <Dialog
        open={checkout !== null}
        onOpenChange={(open) => {
          if (!open) setCheckout(null)
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          {checkout && (
            <>
              <DialogHeader>
                <DialogTitle>{t('billing.checkout.title')}</DialogTitle>
                <DialogDescription>
                  {checkout.plan.name} · {priceLabel(checkout.plan, t('billing.free'))} · +
                  {checkout.plan.credits} {t('billing.credits')}
                </DialogDescription>
              </DialogHeader>

              {checkout.phase === 'form' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-method">{t('billing.checkout.method')}</Label>
                    <Select
                      value={method}
                      onValueChange={(v) => setMethod(v as PaymentMethod)}
                    >
                      <SelectTrigger id="checkout-method" className="h-10 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => (
                          <SelectItem key={m} value={m}>
                            {METHOD_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => void confirmCheckout()}
                    disabled={creating}
                    className="h-10 w-full rounded-xl font-semibold"
                  >
                    {creating && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {t('billing.checkout.confirm')}
                  </Button>
                </div>
              )}

              {checkout.phase === 'waiting' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-600">
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
                    {t('billing.checkout.waiting')}
                  </div>
                  {checkout.payment && checkout.payment.status !== 'pending' && (
                    <div className="flex items-center gap-2">
                      <PaymentStatusBadge status={checkout.payment.status} />
                    </div>
                  )}
                  {checkoutUrl && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (checkoutUrl) window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
                      }}
                      className="w-full rounded-xl"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      {t('billing.checkout.open')}
                    </Button>
                  )}
                </div>
              )}

              {checkout.phase === 'demo' && (
                <div className="space-y-3">
                  <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[12.5px] font-medium leading-relaxed text-amber-700">
                    {t('billing.checkout.demo')}
                  </p>
                  <Button
                    onClick={() => void simulatePayment()}
                    disabled={simulating}
                    className="h-10 w-full rounded-xl font-semibold"
                  >
                    {simulating && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {t('billing.checkout.simulate')}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Polling do pagamento: montado só enquanto há algo pendente */}
      {checkout?.phase === 'waiting' &&
        checkout.payment &&
        checkout.payment.status === 'pending' && (
          <CheckoutPoll paymentId={checkout.payment.id} onResult={handlePollResult} />
        )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Faz polling de GET /api/payments/[id] a cada 3s (máx. 40 tentativas ≈
 * 2 min). Limpa o intervalo no unmount, ao esgotar as tentativas ou quando
 * o componente-pai desmonta o poll (status saiu de 'pending').
 */
function CheckoutPoll({
  paymentId,
  onResult,
}: {
  paymentId: string
  onResult: (payment: PaymentDTO) => void
}) {
  const onResultRef = useRef(onResult)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    let attempts = 0
    let cancelled = false

    const timer = setInterval(() => {
      if (cancelled) return
      attempts += 1
      if (attempts > MAX_POLL_ATTEMPTS) {
        clearInterval(timer) // ~2 min sem confirmação — desiste em silêncio
        return
      }
      void (async () => {
        try {
          const res = await apiFetch(`/api/payments/${paymentId}`)
          if (!res.ok || cancelled) return
          const data = (await res.json()) as { payment?: PaymentDTO }
          if (!cancelled && data.payment) onResultRef.current(data.payment)
        } catch {
          // falha de rede — tenta novamente no próximo ciclo
        }
      })()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [paymentId])

  return null
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useI18n()
  return (
    <Badge
      className={`mt-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_STYLES[status]}`}
    >
      {t(`billing.status.${status}`)}
    </Badge>
  )
}
