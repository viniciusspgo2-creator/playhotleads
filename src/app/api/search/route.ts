// src/app/api/search/route.ts
// POST: inicia busca (cria row + enfileira job). O request NUNCA espera o
// scraping — retorna o id na hora e o client abre o SSE.
// SaaS: exige login; cobra créditos conforme config global (per_search
// deduz à frente; per_lead limita o orçamento da busca ao saldo atual).

import { after, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { executeSearch } from '@/core/orchestrator'
import { getAppConfig } from '@/core/appconfig'
import { isCountryCode } from '@/core/countries'

export const dynamic = 'force-dynamic'
// A busca roda em after() DENTRO desta função: precisa do teto de tempo máximo.
// (Hobby c/ Fluid Compute: até 300s; Pro/Enterprise: pode subir — ajuste
// SEARCH_BUDGET_MS em core/orchestrator.ts junto.)
export const maxDuration = 300

const BodySchema = z.object({
  niche: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(80),
  country: z.string().refine(isCountryCode, 'país não suportado'),
  limit: z.number().int().min(5).max(300).default(80),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)
    const config = await getAppConfig()

    if (config.maintenance && user.role !== 'master') {
      return NextResponse.json({ error: 'sistema em manutenção — volte em instantes' }, { status: 503 })
    }

    const json: unknown = await request.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'parâmetros inválidos', issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      )
    }

    const { niche, location, country, limit: requested } = parsed.data
    const limit = Math.min(requested, config.maxLeadsPerSearch)
    const isMaster = user.role === 'master'

    // ---- cobrança de créditos -----------------------------------------
    let creditBudget: number | null = null
    if (!isMaster) {
      if (config.creditMode === 'per_search') {
        const cost = config.costPerSearch
        const charged = await db.user.updateMany({
          where: { id: user.id, credits: { gte: cost } },
          data: { credits: { decrement: cost } },
        })
        if (charged.count === 0) {
          return NextResponse.json(
            { error: 'créditos insuficientes', needCredits: cost, credits: user.credits },
            { status: 402 },
          )
        }
      } else {
        if (user.credits <= 0) {
          return NextResponse.json(
            { error: 'créditos esgotados — contrate um plano', needCredits: 0, credits: 0 },
            { status: 402 },
          )
        }
        creditBudget = user.credits
      }
    }

    const search = await db.search.create({
      data: { tenantId: user.tenantId, niche, location, country, status: 'running' },
    })

    // Resposta volta na hora; o scraping continua vivo depois dela via after()
    // (waitUntil da Vercel). O progresso vai pro banco e o SSE lê de lá.
    after(() =>
      executeSearch({
        searchId: search.id,
        tenantId: user.tenantId,
        params: { niche, location, country, limit, seed: search.id },
        creditBudget,
        chargeUserId: config.creditMode === 'per_lead' && !isMaster ? user.id : null,
      }),
    )

    const fresh = await db.user.findUnique({ where: { id: user.id }, select: { credits: true } })
    return NextResponse.json({ id: search.id, credits: fresh?.credits ?? user.credits }, { status: 201 })
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return NextResponse.json(auth.body, { status: auth.status })
    const message = err instanceof Error ? err.message : 'erro inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
