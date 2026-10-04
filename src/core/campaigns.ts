// src/core/campaigns.ts
// Campanhas de WhatsApp: motor de disparo com cadência humana (fila,
// fora do request), estados progressivos queued→sent→delivered→replied.
// Envio REAL exige WhatsApp Business API com credenciais do tenant —
// até lá o motor é simulado (declarado na UI) e cada lead tem wa.me real.

import { db } from '@/lib/db'
import { publishCampaign } from '@/lib/bus'

/** Teto de tempo por execução (a rota define maxDuration = 300s). */
export const CAMPAIGN_BUDGET_MS = 250_000
/** Campanha "running" sem atividade por tanto tempo é retomada pelo polling. */
export const CAMPAIGN_STALE_MS = 20_000

const sleepMs = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function renderTemplate(
  template: string,
  vars: { nome: string; empresa: string; cidade: string },
): string {
  return template
    .replaceAll('{{nome}}', vars.nome)
    .replaceAll('{{empresa}}', vars.empresa)
    .replaceAll('{{cidade}}', vars.cidade)
}

export function waMeLink(phoneE164: string, body: string): string {
  return `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`
}

/**
 * Executa a campanha até acabar OU até o orçamento de tempo (serverless).
 * Resolve só no fim — rode dentro de after(). É seguro rodar em paralelo e
 * retomar: cada mensagem é "reivindicada" atomicamente (queued → sent).
 */
export async function runCampaign(campaignId: string): Promise<void> {
  const deadline = Date.now() + CAMPAIGN_BUDGET_MS

  const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign || campaign.status === 'done') return

  const rand = (min: number, max: number) => min + Math.random() * (max - min)

  const queued = await db.campaignMessage.findMany({
    where: { campaignId, status: 'queued' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  for (const { id } of queued) {
    // sem tempo para outra mensagem completa — a próxima execução retoma
    if (Date.now() > deadline - 12_000) return

    const claimed = await db.campaignMessage.updateMany({
      where: { id, status: 'queued' },
      data: { status: 'sent' },
    })
    if (claimed.count === 0) continue // outro executor pegou

    // 1) envio
    await sleepMs(rand(350, 1300))
    const afterSent = await db.campaign.update({
      where: { id: campaignId },
      data: { sent: { increment: 1 } },
    })
    publishCampaign(campaignId, {
      type: 'progress',
      campaignId,
      sent: afterSent.sent,
      delivered: afterSent.delivered,
      replied: afterSent.replied,
      status: 'running',
    })

    // 2) entrega (falha ~5%)
    await sleepMs(rand(800, 2600))
    if (Math.random() < 0.05) {
      await db.campaignMessage.update({ where: { id }, data: { status: 'failed' } })
      continue
    }
    await db.campaignMessage.update({ where: { id }, data: { status: 'delivered' } })
    await db.campaign.update({
      where: { id: campaignId },
      data: { delivered: { increment: 1 } },
    })

    // 3) resposta (~32%)
    if (Math.random() < 0.32) {
      await sleepMs(rand(1500, 5000))
      await db.campaignMessage.update({ where: { id }, data: { status: 'replied' } })
      await db.campaign.update({
        where: { id: campaignId },
        data: { replied: { increment: 1 } },
      })
    }
  }

  // terminou a fila? só então marca como concluída
  const remaining = await db.campaignMessage.count({ where: { campaignId, status: 'queued' } })
  if (remaining === 0) {
    const final = await db.campaign.update({ where: { id: campaignId }, data: { status: 'done' } })
    publishCampaign(campaignId, {
      type: 'progress',
      campaignId,
      sent: final.sent,
      delivered: final.delivered,
      replied: final.replied,
      status: 'done',
    })
  }
}
