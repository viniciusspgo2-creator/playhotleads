// src/app/api/webhooks/mercadopago/route.ts
// Webhook do Mercado Pago. MP manda topic=payment&id=<paymentId>; buscamos o
// pagamento na API do MP, amarramos pelo external_reference (nosso Payment.id)
// e concedemos créditos via approvePayment (idempotente).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAppSecrets } from '@/core/appconfig'
import { approvePayment } from '@/core/billing'

export const dynamic = 'force-dynamic'

interface MpPayment {
  id: string
  status?: string
  external_reference?: string
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const topic = url.searchParams.get('topic') ?? url.searchParams.get('type') ?? 'payment'
    const mpId = url.searchParams.get('id') ?? url.searchParams.get('data.id')
    if (topic !== 'payment' || !mpId) {
      return NextResponse.json({ ignored: true })
    }

    const secrets = await getAppSecrets()
    if (!secrets.mercadopagoToken) {
      return NextResponse.json({ ignored: true })
    }

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: { authorization: `Bearer ${secrets.mercadopagoToken}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return NextResponse.json({ ignored: true }, { status: 200 })

    const mp = (await res.json()) as MpPayment
    if (!mp.external_reference) return NextResponse.json({ ignored: true })

    const payment = await db.payment.findUnique({ where: { id: mp.external_reference } })
    if (!payment || payment.gateway !== 'mercadopago') {
      return NextResponse.json({ ignored: true })
    }

    if (mp.status === 'approved') await approvePayment(payment.id, 'webhook')
    return NextResponse.json({ received: true })
  } catch {
    // webhook nunca deve derrubar 5xx pro gateway re-tentar infinito
    return NextResponse.json({ received: true })
  }
}
