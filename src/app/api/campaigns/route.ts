// src/app/api/campaigns/route.ts
// POST: cria campanha segmentada por estágio do Kanban e dispara o motor.
// GET: lista com estatísticas + últimas mensagens.

import { after, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { CAMPAIGN_STALE_MS, renderTemplate, runCampaign } from '@/core/campaigns'
import { KANBAN_STAGES } from '@/core/types'

export const dynamic = 'force-dynamic'
// O motor de disparo roda em after() dentro desta função (e é retomado pelo GET).
export const maxDuration = 300

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  template: z.string().trim().min(10).max(600),
  stage: z.enum(KANBAN_STAGES as [string, ...string[]]),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    const json: unknown = await request.json()
    const parsed = CreateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'payload inválido', issues: parsed.error.issues.map((i) => i.message) }, { status: 400 })
    }

    const { name, template, stage } = parsed.data

    const recipients = await db.lead.findMany({
      where: {
        tenantId: user.tenantId,
        kanbanStage: stage,
        phoneE164: { not: null },
        whatsapp: true,
      },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, name: true, phoneE164: true, country: true },
  })

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: 'nenhum lead com WhatsApp no estágio selecionado — mova leads no Kanban primeiro' },
      { status: 400 },
    )
  }

  const campaign = await db.campaign.create({
    data: {
      tenantId: user.tenantId,
      name,
      template,
      stage,
      total: recipients.length,
      status: 'running',
    },
  })

  await db.campaignMessage.createMany({
    data: recipients.map((lead) => ({
      campaignId: campaign.id,
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phoneE164 ?? '',
      body: renderTemplate(template, {
        nome: lead.name.split(' ')[0] ?? lead.name,
        empresa: lead.name,
        cidade: lead.country,
      }),
      status: 'queued',
    })),
  })

  after(() => runCampaign(campaign.id))

  return NextResponse.json({ id: campaign.id, total: recipients.length }, { status: 201 })
} catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)

    const campaigns = await db.campaign.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 60, select: { id: true, leadName: true, status: true, body: true } },
      },
    })

    // Retomada: se a execução serverless anterior acabou (teto de tempo) e
    // ainda há mensagens na fila, o polling do client dispara a próxima rodada.
    const staleBefore = Date.now() - CAMPAIGN_STALE_MS
    for (const c of campaigns) {
      if (c.status === 'running' && c.updatedAt.getTime() < staleBefore) {
        after(() => runCampaign(c.id))
      }
    }

    return NextResponse.json({ campaigns })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
