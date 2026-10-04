// src/app/api/master/plans/route.ts
// GET: todos os planos (inclusive inativos, ordenados por sortOrder).
// POST: criação de plano. Nome é único (P2002 → 409).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { authErrorResponse, requireMaster } from '@/lib/auth'
import { toPlanDTO } from '@/core/dto'

export const dynamic = 'force-dynamic'

const PlanSchema = z.object({
  name: z.string().trim().min(2).max(40),
  priceCents: z.number().int().min(0),
  credits: z.number().int().min(0),
  features: z
    .array(z.string().trim().max(80))
    .max(8)
    .transform((arr) => arr.filter((s) => s.length > 0)),
  active: z.boolean().default(true),
  highlight: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

export async function GET(request: Request) {
  try {
    await requireMaster(request)
    const plans = await db.plan.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ plans: plans.map(toPlanDTO) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireMaster(request)

    const json: unknown = await request.json()
    const parsed = PlanSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'dados do plano inválidos' }, { status: 400 })
    }
    const { name, priceCents, credits, features, active, highlight, sortOrder } = parsed.data

    let plan
    try {
      plan = await db.plan.create({
        data: {
          name,
          priceCents,
          credits,
          features: JSON.stringify(features),
          active,
          highlight,
          sortOrder,
        },
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return NextResponse.json({ error: 'já existe um plano com esse nome' }, { status: 409 })
      }
      throw err
    }

    return NextResponse.json({ plan: toPlanDTO(plan) })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
