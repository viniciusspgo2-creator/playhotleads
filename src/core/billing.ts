// src/core/billing.ts
// Billing do SaaS: planos → Payment → gateway → créditos.
// Gateway real (Mercado Pago / Asaas) quando o master configurou a credencial;
// caso contrário cai no gateway 'demo' (checkout simulado aprovável na UI) —
// o mesmo contrato de BYOK dos providers: zero dado fake quando há credencial.
// Créditos só entram via approvePayment (idempotente — webhook e polling são
// seguros contra dupla concessão).

import { db } from '@/lib/db'
import { getAppConfig, getAppSecrets } from './appconfig'
import type { Payment, Plan, User } from '@prisma/client'
import type { PaymentDTO, PaymentMethod } from './types'

export const PAYMENT_METHODS: PaymentMethod[] = ['pix', 'mercadopago', 'credit_card', 'asaas']

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix (Mercado Pago)',
  mercadopago: 'Mercado Pago',
  credit_card: 'Cartão de crédito',
  asaas: 'Asaas',
}

/** Escolhe o gateway pelo método + credenciais configuradas. */
async function resolveGateway(method: PaymentMethod): Promise<'mercadopago' | 'asaas' | 'demo'> {
  const config = await getAppConfig()
  const secrets = await getAppSecrets()
  const mpReady = config.mercadopagoEnabled && Boolean(secrets.mercadopagoToken)
  const asaasReady = config.asaasEnabled && Boolean(secrets.asaasApiKey)

  if (method === 'asaas' && asaasReady) return 'asaas'
  if ((method === 'pix' || method === 'mercadopago' || method === 'credit_card') && mpReady) {
    return 'mercadopago'
  }
  return 'demo'
}

export interface CheckoutOutcome {
  externalId: string | null
  checkoutUrl: string | null
}

async function checkoutMercadoPago(payment: Payment, plan: Plan, user: User): Promise<CheckoutOutcome> {
  const config = await getAppConfig()
  const secrets = await getAppSecrets()
  if (!secrets.mercadopagoToken) throw new Error('credencial Mercado Pago ausente')

  const base = config.publicUrl.replace(/\/$/, '')
  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secrets.mercadopagoToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      external_reference: payment.id,
      items: [
        {
          id: plan.id,
          title: `${config.brandName} — Plano ${plan.name} (${plan.credits} créditos)`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: payment.amountCents / 100,
        },
      ],
      payer: { name: user.name, email: user.email },
      payment_methods: payment.method === 'pix'
        ? { excluded_payment_types: [{ id: 'credit_card' }, { id: 'ticket' }], installments: 1 }
        : undefined,
      ...(base
        ? {
            back_urls: { success: `${base}/#/app?tab=billing`, pending: `${base}/#/app?tab=billing`, failure: `${base}/#/app?tab=billing` },
            notification_url: `${base}/api/webhooks/mercadopago`,
          }
        : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Mercado Pago recusou o checkout (${res.status}): ${text.slice(0, 180)}`)
  }
  const data = (await res.json()) as { id?: string; init_point?: string }
  return { externalId: data.id ?? null, checkoutUrl: data.init_point ?? null }
}

async function checkoutAsaas(payment: Payment, plan: Plan, user: User): Promise<CheckoutOutcome> {
  const config = await getAppConfig()
  const secrets = await getAppSecrets()
  if (!secrets.asaasApiKey) throw new Error('credencial Asaas ausente')

  const baseUrl = config.asaasSandbox ? 'https://api-sandbox.asaas.com' : 'https://api.asaas.com'
  const headers = { access_token: secrets.asaasApiKey, 'content-type': 'application/json' }

  // PaymentLink DETACHED: cliente paga Pix ou cartão direto no link da Asaas
  const res = await fetch(`${baseUrl}/v3/paymentLinks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `${plan.name} — ${plan.credits} créditos`,
      chargeType: 'DETACHED',
      billingTypes: payment.method === 'credit_card' ? 'CREDIT_CARD' : 'UNDEFINED',
      value: payment.amountCents / 100,
      dueDateLimitDays: 7,
      maxInstallmentCount: payment.method === 'credit_card' ? 12 : 1,
      notificationEnabled: false,
      description: `${plan.name} (${plan.credits} créditos) — ref ${payment.id}`,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Asaas recusou o checkout (${res.status}): ${text.slice(0, 180)}`)
  }
  const data = (await res.json()) as { id?: string; url?: string }
  return { externalId: data.id ?? null, checkoutUrl: data.url ?? null }
}

/** Cria o Payment (pending) e resolve checkout no gateway escolhido. */
export async function createPaymentForUser(user: User, plan: Plan, method: PaymentMethod): Promise<Payment> {
  const gateway = await resolveGateway(method)

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      planId: plan.id,
      planName: plan.name,
      amountCents: plan.priceCents,
      credits: plan.credits,
      method,
      gateway,
      status: 'pending',
    },
  })

  if (plan.priceCents === 0) {
    // plano gratuito: aprova na hora (sem gateway)
    const approved = await approvePayment(payment.id, 'manual')
    return approved ?? payment
  }

  if (gateway === 'demo') {
    return payment // aprovável via /api/payments/[id]/simulate
  }

  try {
    const outcome =
      gateway === 'mercadopago'
        ? await checkoutMercadoPago(payment, plan, user)
        : await checkoutAsaas(payment, plan, user)
    return await db.payment.update({
      where: { id: payment.id },
      data: { externalId: outcome.externalId, checkoutUrl: outcome.checkoutUrl },
    })
  } catch (err) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'failed', payload: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) },
    })
    throw err
  }
}

/** Concessão de créditos — idempotente (webhook + polling + manual). */
export async function approvePayment(paymentId: string, via: 'webhook' | 'polling' | 'manual' | 'simulate'): Promise<Payment | null> {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment) return null
  if (payment.status === 'paid') return payment

  return db.$transaction(async (tx) => {
    const locked = await tx.payment.findUnique({ where: { id: paymentId } })
    if (!locked || locked.status === 'paid') return locked

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'paid', paidAt: new Date(), payload: JSON.stringify({ ...(payment.payload ? JSON.parse(payment.payload) : {}), approvedBy: via }) },
    })
    await tx.user.update({
      where: { id: payment.userId },
      data: { credits: { increment: payment.credits }, planId: payment.planId },
    })
    return updated
  })
}

export async function failPayment(paymentId: string): Promise<Payment | null> {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.status === 'paid') return payment
  return db.payment.update({ where: { id: paymentId }, data: { status: 'failed' } })
}

/** Consulta status no gateway (pagamento pendente com externalId). */
async function pollGatewayStatus(payment: Payment): Promise<'pending' | 'paid' | 'failed'> {
  if (!payment.externalId) return 'pending'
  const config = await getAppConfig()
  const secrets = await getAppSecrets()

  try {
    if (payment.gateway === 'mercadopago' && secrets.mercadopagoToken) {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${payment.externalId}`, {
        headers: { authorization: `Bearer ${secrets.mercadopagoToken}` },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return 'pending'
      const data = (await res.json()) as { status?: string }
      if (data.status === 'approved') return 'paid'
      if (data.status === 'rejected' || data.status === 'cancelled') return 'failed'
      return 'pending'
    }
    if (payment.gateway === 'asaas' && secrets.asaasApiKey) {
      const baseUrl = config.asaasSandbox ? 'https://api-sandbox.asaas.com' : 'https://api.asaas.com'
      const res = await fetch(`${baseUrl}/v3/payments/${payment.externalId}`, {
        headers: { access_token: secrets.asaasApiKey },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return 'pending'
      const data = (await res.json()) as { status?: string }
      if (data.status === 'RECEIVED' || data.status === 'CONFIRMED' || data.status === 'RECEIVED_IN_CASH') return 'paid'
      if (data.status === 'OVERDUE' || data.status === 'REFUNDED') return 'failed'
      return 'pending'
    }
  } catch {
    return 'pending' // gateway indisponível — continua pendente, webhook cobre
  }
  return 'pending'
}

/** GET /api/payments/[id]: sincroniza pendente com o gateway antes de responder. */
export async function syncPaymentStatus(payment: Payment): Promise<Payment> {
  if (payment.status !== 'pending') return payment
  const remote = await pollGatewayStatus(payment)
  if (remote === 'paid') return (await approvePayment(payment.id, 'polling')) ?? payment
  if (remote === 'failed') return (await failPayment(payment.id)) ?? payment
  return payment
}

export function toPaymentDTO(payment: Payment & { user?: { name: string; email: string } | null }): PaymentDTO {
  return {
    id: payment.id,
    userId: payment.userId,
    userName: payment.user?.name ?? null,
    userEmail: payment.user?.email ?? null,
    planId: payment.planId,
    planName: payment.planName,
    amountCents: payment.amountCents,
    credits: payment.credits,
    method: payment.method as PaymentDTO['method'],
    gateway: payment.gateway as PaymentDTO['gateway'],
    status: payment.status as PaymentDTO['status'],
    externalId: payment.externalId,
    checkoutUrl: payment.checkoutUrl,
    createdAt: payment.createdAt.toISOString(),
    paidAt: payment.paidAt?.toISOString() ?? null,
  }
}
