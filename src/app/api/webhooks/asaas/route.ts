// src/app/api/webhooks/asaas/route.ts
// Webhook da Asaas: evento PAYMENT_RECEIVED/PAYMENT_CONFIRMED concede os
// créditos. A Asaas preenche externalReference quando criamos o pagamento —
// no fluxo de paymentLink usamos a description "ref <paymentId>" como última
// linha de amarração.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { approvePayment } from '@/core/billing'
import { getAppConfig, getAppSecrets } from '@/core/appconfig'

export const dynamic = 'force-dynamic'

interface AsaasEvent {
  event?: string
  payment?: { id?: string; externalReference?: string; description?: string; status?: string }
}

function refFromDescription(description: string | undefined): string | null {
  if (!description) return null
  const match = description.match(/ref ([A-Za-z0-9]+)/)
  return match?.[1] ?? null
}

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as AsaasEvent
    const p = event.payment
    const isPaid = event.event === 'PAYMENT_RECEIVED' || event.event === 'PAYMENT_CONFIRMED'
    if (!isPaid || !p) return NextResponse.json({ received: true })

    const ref = p.externalReference || refFromDescription(p.description)
    if (!ref) return NextResponse.json({ received: true })

    const payment = await db.payment.findUnique({ where: { id: ref } })
    if (!payment || payment.gateway !== 'asaas') {
      return NextResponse.json({ received: true })
    }

    // Nunca confia no corpo do webhook (qualquer um pode forjá-lo): confirma o
    // status consultando a API da Asaas com a chave do master — mesmo modelo
    // de segurança do webhook do Mercado Pago.
    const secrets = await getAppSecrets()
    const config = await getAppConfig()
    if (!secrets.asaasApiKey || !p.id) return NextResponse.json({ ignored: true })

    const base = config.asaasSandbox ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3'
    const check = await fetch(`${base}/payments/${encodeURIComponent(p.id)}`, {
      headers: { access_token: secrets.asaasApiKey },
      signal: AbortSignal.timeout(10_000),
    })
    if (!check.ok) return NextResponse.json({ ignored: true })
    const remote = (await check.json()) as { status?: string; externalReference?: string; description?: string }
    const remoteRef = remote.externalReference || refFromDescription(remote.description)
    const confirmed = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(remote.status ?? '')
    if (!confirmed || remoteRef !== payment.id) return NextResponse.json({ ignored: true })

    await approvePayment(payment.id, 'webhook')
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ received: true })
  }
}
